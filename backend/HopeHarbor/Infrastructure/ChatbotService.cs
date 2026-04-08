using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace HopeHarbor.Infrastructure;

public interface IChatbotService
{
    Task<ChatAnswerResult> AskAsync(string message, IReadOnlyList<ChatHistoryItem> history, CancellationToken cancellationToken);
}

public sealed record ChatHistoryItem(string Role, string Content);
public sealed record ChatCitation(string Title, string? Url);
public sealed record ChatAnswerResult(string Answer, IReadOnlyList<ChatCitation> Citations);

internal sealed class KnowledgeItem
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string[] Tags { get; set; } = [];
}

public sealed class ChatbotService : IChatbotService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private const string UnsupportedQuestionReply = "We cannot help you with that. Is there something else we can help you with today?";
    private const string UnsafeQuestionReply = "I cannot assist with that. Is there something else I can help you with today?";
    private static readonly string[] PrivacySensitivePhrases =
    [
        "private information",
        "personal information",
        "resident name",
        "resident names",
        "girls",
        "survivor names",
        "phone number",
        "email address",
        "home address",
        "donor list",
        "who donated",
        "how much people have donated",
        "how much has been donated",
        "total donated",
        "total donations",
        "exact donation amount",
    ];
    private static readonly string[] DonationAmountSignals =
    [
        "how much",
        "total",
        "amount",
        "exact",
        "specific",
        "dollars",
        "money",
        "raised",
    ];
    private static readonly string[] WebsiteScopeSignals =
    [
        "website",
        "site",
        "page",
        "portal",
        "account",
        "login",
        "register",
        "donate",
        "donation",
        "contact",
        "privacy",
        "cookies",
        "about",
        "impact",
        "program",
        "support",
        "help",
        "navigation",
        "team",
        "email",
        "phone",
        "mission",
        "services",
        "cookie",
        "policy",
        "sign",
        "signin",
        "signup",
    ];
    private static readonly string[] OutOfScopeSignals =
    [
        "homework",
        "math problem",
        "weather",
        "stock price",
        "recipe",
        "translate",
        "write me code",
    ];
    private static readonly string[] HarmfulIntentPhrases =
    [
        "hurt someone",
        "harm someone",
        "kill someone",
        "attack someone",
        "poison",
        "stab",
        "make a bomb",
        "how to hurt",
        "how to kill",
        "how to attack",
    ];
    private static readonly Dictionary<string, string[]> IntentTermGroups = new(StringComparer.OrdinalIgnoreCase)
    {
        ["contact"] = ["contact", "team", "support", "help", "email", "phone", "reach", "connect", "staff", "contcat", "cntact"],
        ["privacy"] = ["privacy", "safe", "safety", "security", "confidential", "personal", "protect"],
        ["cookies"] = ["cookie", "cookies", "tracking", "consent", "policy"],
        ["impact"] = ["impact", "transparency", "report", "accountability", "outcomes", "results"],
        ["donate"] = ["donate", "donation", "give", "giving", "gift", "contribute", "contribution"],
        ["login"] = ["login", "log", "signin", "sign", "access", "account", "portal"],
        ["register"] = ["register", "signup", "create", "account", "join"],
        ["about"] = ["about", "mission", "program", "programs", "services", "organization"],
    };
    private readonly HttpClient _httpClient;
    private readonly ILogger<ChatbotService> _logger;
    private readonly string _model;
    private readonly string? _apiKey;
    private readonly IReadOnlyList<KnowledgeItem> _knowledge;

    public ChatbotService(HttpClient httpClient, IWebHostEnvironment env, ILogger<ChatbotService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _model = Environment.GetEnvironmentVariable("OPENAI_MODEL")?.Trim() ?? "gpt-4o-mini";
        _apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim();
        _knowledge = LoadKnowledge(env.ContentRootPath, logger);
    }

    public async Task<ChatAnswerResult> AskAsync(string message, IReadOnlyList<ChatHistoryItem> history, CancellationToken cancellationToken)
    {
        if (IsUnsafeQuestion(message))
        {
            return new ChatAnswerResult(UnsafeQuestionReply, []);
        }

        if (IsPrivacySensitiveQuestion(message))
        {
            return new ChatAnswerResult(UnsupportedQuestionReply, []);
        }

        if (IsOutOfScopeQuestion(message))
        {
            return new ChatAnswerResult(UnsupportedQuestionReply, []);
        }

        var docs = RetrieveRelevantDocs(message, history);
        var citations = docs.Select(d => new ChatCitation(d.Title, d.Url)).ToList();

        if (docs.Count == 0)
        {
            return new ChatAnswerResult(UnsupportedQuestionReply, []);
        }

        var fallbackAnswer = BuildFallbackAnswer(docs);
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            _logger.LogWarning("OPENAI_API_KEY not configured. Returning retrieval fallback answer.");
            return new ChatAnswerResult(fallbackAnswer, citations);
        }

        try
        {
            var llmAnswer = await GenerateAnswerWithLlmAsync(message, history, docs, cancellationToken);
            if (string.IsNullOrWhiteSpace(llmAnswer))
                return new ChatAnswerResult(fallbackAnswer, citations);

            return new ChatAnswerResult(llmAnswer, citations);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chatbot LLM request failed; returning fallback response.");
            return new ChatAnswerResult(fallbackAnswer, citations);
        }
    }

    private async Task<string?> GenerateAnswerWithLlmAsync(
        string message,
        IReadOnlyList<ChatHistoryItem> history,
        IReadOnlyList<KnowledgeItem> docs,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        var contextBlocks = string.Join(
            "\n\n",
            docs.Select((doc, index) => $"[{index + 1}] {doc.Title}\nURL: {doc.Url ?? "n/a"}\n{doc.Content}"));

        var conversation = string.Join(
            "\n",
            history.TakeLast(6).Select(item => $"{item.Role}: {item.Content}"));

        var body = new
        {
            model = _model,
            temperature = 0.2,
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content =
                        "You are a website help assistant for a class project nonprofit site. " +
                        "Answer using only the provided context. If context is missing, clearly say you do not know and suggest the contact page. " +
                        "Prioritize matching the user's intent to the right page (for example contact, privacy, impact, login, or donation). " +
                        "Keep answers concise and practical. Never fabricate policies, legal details, or numbers. " +
                        "Do not include raw URL paths like /contact in your response text."
                },
                new
                {
                    role = "user",
                    content =
                        $"Context:\n{contextBlocks}\n\nRecent conversation:\n{conversation}\n\nUser question:\n{message}\n\n" +
                        "Provide a direct answer in 2-4 short sentences."
                }
            }
        };

        request.Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("OpenAI chat completion failed ({StatusCode}): {Error}", response.StatusCode, error);
            return null;
        }

        var payload = await response.Content.ReadAsStringAsync(cancellationToken);
        using var document = JsonDocument.Parse(payload);
        return document.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();
    }

    private List<KnowledgeItem> RetrieveRelevantDocs(string message, IReadOnlyList<ChatHistoryItem> history)
    {
        var query = string.Join(" ", history.TakeLast(3).Select(h => h.Content).Append(message));
        var normalizedMessage = Normalize(message);
        var queryTokens = BuildExpandedQueryTokenSet(query);

        var ranked = _knowledge
            .Select(doc =>
            {
                var docTokens = Tokenize($"{doc.Title} {doc.Content} {string.Join(' ', doc.Tags)}").ToArray();
                var titleTokens = Tokenize(doc.Title).ToArray();
                var tagTokens = doc.Tags.SelectMany(Tokenize).ToArray();

                var contentOverlap = docTokens.Count(token => queryTokens.Contains(token));
                var titleOverlap = titleTokens.Count(token => queryTokens.Contains(token));
                var tagOverlap = tagTokens.Count(token => queryTokens.Contains(token));
                var intentBoost = GetIntentBoost(normalizedMessage, doc);

                var score = contentOverlap + (titleOverlap * 2) + (tagOverlap * 3) + intentBoost;
                return new { Doc = doc, Score = score };
            })
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Doc.Title)
            .ToList();

        var topScored = ranked.Where(item => item.Score > 0).Take(3).Select(item => item.Doc).ToList();
        if (topScored.Count > 0) return topScored;

        return ranked.Take(2).Select(item => item.Doc).ToList();
    }

    private static IEnumerable<string> Tokenize(string value)
    {
        var normalized = new string(
            value.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) ? ch : ' ').ToArray());

        return normalized
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(token => token.Length > 2);
    }

    private static HashSet<string> BuildExpandedQueryTokenSet(string query)
    {
        var tokens = Tokenize(query).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var expanded = new HashSet<string>(tokens, StringComparer.OrdinalIgnoreCase);

        foreach (var token in tokens)
        {
            foreach (var group in IntentTermGroups.Values)
            {
                if (!group.Contains(token, StringComparer.OrdinalIgnoreCase))
                    continue;

                foreach (var term in group)
                    expanded.Add(term);
            }
        }

        return expanded;
    }

    private static string BuildFallbackAnswer(IReadOnlyList<KnowledgeItem> docs)
    {
        var summary = string.Join(" ", docs.Take(2).Select(doc => doc.Content.Trim()));
        if (summary.Length > 420)
            summary = $"{summary[..420].TrimEnd()}...";

        return $"{summary} If you need more details, please use the contact page.";
    }

    private static IReadOnlyList<KnowledgeItem> LoadKnowledge(string contentRootPath, ILogger logger)
    {
        try
        {
            var path = Path.Combine(contentRootPath, "Data", "chatbot-knowledge.json");
            if (!File.Exists(path))
            {
                logger.LogWarning("Chatbot knowledge file not found at {Path}", path);
                return [];
            }

            var json = File.ReadAllText(path);
            var docs = JsonSerializer.Deserialize<List<KnowledgeItem>>(json, JsonOptions);
            return docs?.Where(item => !string.IsNullOrWhiteSpace(item.Content)).ToList() ?? [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load chatbot knowledge file.");
            return [];
        }
    }

    private static bool IsPrivacySensitiveQuestion(string message)
    {
        var normalized = Normalize(message);

        if (PrivacySensitivePhrases.Any(phrase => normalized.Contains(phrase, StringComparison.Ordinal)))
            return true;

        var asksAboutPeople = normalized.Contains("people", StringComparison.Ordinal)
                             || normalized.Contains("donor", StringComparison.Ordinal)
                             || normalized.Contains("donors", StringComparison.Ordinal);
        var asksForDonationAmounts = normalized.Contains("donat", StringComparison.Ordinal)
                                     && DonationAmountSignals.Any(signal => normalized.Contains(signal, StringComparison.Ordinal));

        return asksAboutPeople && asksForDonationAmounts;
    }

    private static bool IsOutOfScopeQuestion(string message)
    {
        var normalized = Normalize(message);

        if (OutOfScopeSignals.Any(signal => normalized.Contains(signal, StringComparison.Ordinal)))
            return true;

        // We only hard-block clearly unrelated prompts; unknown website questions can still
        // continue through retrieval where they will safely fall back to contact guidance.
        return !WebsiteScopeSignals.Any(signal => normalized.Contains(signal, StringComparison.Ordinal))
               && normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Length <= 2;
    }

    private static string Normalize(string value)
    {
        return new string(value.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) || char.IsWhiteSpace(ch) ? ch : ' ').ToArray());
    }

    private static bool IsUnsafeQuestion(string message)
    {
        var normalized = Normalize(message);
        return HarmfulIntentPhrases.Any(phrase => normalized.Contains(phrase, StringComparison.Ordinal));
    }

    private static int GetIntentBoost(string normalizedMessage, KnowledgeItem doc)
    {
        var url = doc.Url?.ToLowerInvariant() ?? string.Empty;

        if (ContainsAnyTerm(normalizedMessage, IntentTermGroups["contact"])
            && url.Contains("/contact", StringComparison.Ordinal))
        {
            return 10;
        }

        if (ContainsAnyTerm(normalizedMessage, IntentTermGroups["privacy"])
            && url.Contains("/privacy", StringComparison.Ordinal))
        {
            return 10;
        }

        if (ContainsAnyTerm(normalizedMessage, IntentTermGroups["cookies"])
            && url.Contains("/cookies", StringComparison.Ordinal))
        {
            return 10;
        }

        if (ContainsAnyTerm(normalizedMessage, IntentTermGroups["impact"])
            && url.Contains("/impact", StringComparison.Ordinal))
        {
            return 8;
        }

        if (ContainsAnyTerm(normalizedMessage, IntentTermGroups["donate"])
            && url.Contains("/donor/login", StringComparison.Ordinal))
        {
            return 8;
        }

        if ((ContainsAnyTerm(normalizedMessage, IntentTermGroups["login"]) || normalizedMessage.Contains("sign in", StringComparison.Ordinal))
            && (url.Contains("/login", StringComparison.Ordinal) || url.Contains("/donor/login", StringComparison.Ordinal)))
        {
            return 8;
        }

        if ((ContainsAnyTerm(normalizedMessage, IntentTermGroups["register"]) || normalizedMessage.Contains("sign up", StringComparison.Ordinal))
            && url.Contains("/register", StringComparison.Ordinal))
        {
            return 8;
        }

        if (ContainsAnyTerm(normalizedMessage, IntentTermGroups["about"])
            && url.Contains("/about", StringComparison.Ordinal))
        {
            return 8;
        }

        return 0;
    }

    private static bool ContainsAnyTerm(string normalizedMessage, IEnumerable<string> terms)
    {
        return terms.Any(term => normalizedMessage.Contains(term, StringComparison.Ordinal));
    }
}
