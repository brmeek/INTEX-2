namespace HopeHarbor.Infrastructure;

public static class SecurityHeaders
{
    private const string CspPolicy =
        "default-src 'self'; " +
        "base-uri 'self'; " +
        "object-src 'none'; " +
        "frame-ancestors 'none'; " +
        "form-action 'self'; " +
        "connect-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https://*.tile.openstreetmap.org";
    private const string PermissionsPolicy =
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=()";
    private const string ReferrerPolicy = "strict-origin-when-cross-origin";

    public static IApplicationBuilder UseSecurityHeaders(
        this IApplicationBuilder app, IWebHostEnvironment env)
    {
        return app.Use(async (ctx, next) =>
        {
            ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
            ctx.Response.Headers["X-Frame-Options"] = "DENY";
            ctx.Response.Headers["Referrer-Policy"] = ReferrerPolicy;
            ctx.Response.Headers["Permissions-Policy"] = PermissionsPolicy;
            ctx.Response.Headers["Cross-Origin-Opener-Policy"] = "same-origin";
            ctx.Response.Headers["Cross-Origin-Resource-Policy"] = "same-origin";
            ctx.Response.Headers["X-Permitted-Cross-Domain-Policies"] = "none";

            if (!env.IsDevelopment() && !ctx.Request.Path.StartsWithSegments("/swagger"))
            {
                ctx.Response.Headers["Content-Security-Policy"] = CspPolicy;
            }

            await next();
        });
    }
}
