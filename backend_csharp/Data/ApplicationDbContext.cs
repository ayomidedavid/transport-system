using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data.Models;

namespace UniRide.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Profile> Profiles { get; set; } = null!;
        public DbSet<Vendor> Vendors { get; set; } = null!;
        public DbSet<Trip> Trips { get; set; } = null!;
        public DbSet<Booking> Bookings { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;
        public DbSet<Transaction> Transactions { get; set; } = null!;
        public DbSet<Otp> Otps { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Vendor>()
                .HasIndex(v => v.Email)
                .IsUnique();

            modelBuilder.Entity<Transaction>()
                .HasIndex(t => t.Ref)
                .IsUnique();
                
            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.Ref)
                .IsUnique();
        }
    }
}
