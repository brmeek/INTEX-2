namespace HopeHarbor.Infrastructure;

public static class SecurityHeaders
{
    private const string CspPolicy =
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data:";

    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder app, IWebHostEnvironment env)
    {
        return app.Use(async (ctx, next) =>
        {
            if (!env.IsDevelopment() && !ctx.Request.Path.StartsWithSegments("/swagger"))
            {
                ctx.Response.Headers.Append("Content-Security-Policy", CspPolicy);
            }

            await next();
        });
    }
}
