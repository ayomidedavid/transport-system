using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Linq;
using System;
using UniRide.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using UniRide.Api.Data.Models;

namespace UniRide.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationsController(ApplicationDbContext db, IHubContext<NotificationHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            var role = user.Profile.Role;
            var isVendor = role == "vendor";
            var isAdmin = role == "admin";
            
            var query = _db.Notifications.AsQueryable();

            if (isAdmin)
            {
                query = query.Where(n => n.RecipientRole == "admin" || n.RecipientId == userId);
            }
            else
            {
                query = query.Where(n => n.RecipientId == userId);
            }

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();

            return Ok(notifications.Select(n => new {
                id = n.Id,
                type = n.Type,
                title = n.Title,
                body = n.Body,
                read = n.Read,
                bookingRef = n.BookingRef,
                agency = n.Agency,
                agencyEmail = n.AgencyEmail,
                route = n.Route,
                amount = n.Amount,
                createdAt = n.CreatedAt
            }));
        }

        [HttpPost]
        public async Task<IActionResult> AddNotification([FromBody] NotificationDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId);
            var role = user?.Profile?.Role ?? "student";
            if (role == "logistics") role = "vendor";

            var notif = new Notification
            {
                Id = Guid.NewGuid(),
                Type = dto.Type,
                Title = dto.Title,
                Body = dto.Body,
                RecipientId = userId,
                RecipientRole = role,
                BookingRef = dto.BookingRef,
                Agency = dto.Agency,
                AgencyEmail = dto.AgencyEmail,
                Route = dto.Route,
                Amount = dto.Amount,
                Read = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notif);
            await _db.SaveChangesAsync();

            // Broadcast to the user via SignalR
            await _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", notif);

            return Ok(notif);
        }

        [HttpPost("notify-admin")]
        public async Task<IActionResult> NotifyAdmin([FromBody] NotificationDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var notif = new Notification
            {
                Id = Guid.NewGuid(),
                Type = dto.Type,
                Title = dto.Title,
                Body = dto.Body,
                RecipientRole = "admin",
                CreatedAt = DateTime.UtcNow
            };

            _db.Notifications.Add(notif);
            await _db.SaveChangesAsync();

            await _hubContext.Clients.Group("admin").SendAsync("ReceiveNotification", new
            {
                id = notif.Id,
                type = notif.Type,
                title = notif.Title,
                body = notif.Body,
                createdAt = notif.CreatedAt
            });

            return Ok(notif);
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var unread = await _db.Notifications.Where(n => n.RecipientId == userId && !n.Read).ToListAsync();
            foreach (var n in unread) n.Read = true;
            await _db.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Dismiss(Guid id)
        {
            var notif = await _db.Notifications.FindAsync(id);
            if (notif == null) return NotFound();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (notif.RecipientId.ToString() != userIdStr && notif.RecipientRole != "admin")
                return Forbid();

            _db.Notifications.Remove(notif);
            await _db.SaveChangesAsync();

            return Ok();
        }
    }

    public class NotificationDto
    {
        public string Type { get; set; } = "";
        public string Title { get; set; } = "";
        public string Body { get; set; } = "";
        public string? BookingRef { get; set; }
        public string? Agency { get; set; }
        public string? AgencyEmail { get; set; }
        public string? Route { get; set; }
        public string? Amount { get; set; }
    }
}
