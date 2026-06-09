using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace UniRide.Api.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlContent);
    }

    public class EmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(HttpClient httpClient, IConfiguration configuration, ILogger<EmailService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlContent)
        {
            var apiKey = _configuration["Brevo:ApiKey"];
            var senderEmail = _configuration["Brevo:SenderEmail"];
            var senderName = _configuration["Brevo:SenderName"];

            if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_BREVO_API_KEY_HERE")
            {
                _logger.LogInformation($"[email-sim] TO: {to} | SUBJECT: {subject}");
                return;
            }

            var requestBody = new
            {
                sender = new { name = senderName, email = senderEmail },
                to = new[] { new { email = to } },
                subject = subject,
                htmlContent = htmlContent
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
            {
                Content = JsonContent.Create(requestBody)
            };
            request.Headers.Add("api-key", apiKey);

            try
            {
                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Brevo API Error: {error}");
                    _logger.LogWarning($"[email-sim-fallback] TO: {to} | SUBJECT: {subject} | CONTENT: {htmlContent}");
                    // Do not throw an exception so the signup process doesn't fail with a 500
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Brevo Network Error: {ex.Message}");
                _logger.LogWarning($"[email-sim-fallback] TO: {to} | SUBJECT: {subject} | CONTENT: {htmlContent}");
            }
        }
    }
}
