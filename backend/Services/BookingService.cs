using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data;
using UniRide.Api.Data.Models;

namespace UniRide.Api.Services
{
    public interface IBookingService
    {
        Task<(bool success, string error, Booking? booking)> CreateBookingAsync(Guid studentId, Guid tripId, string route, string company, string destination, string date, string? time, string? pickup, string? seat, string refId, string? amount, decimal? priceNum);
        Task<(bool success, string error)> CancelBookingAsync(Guid bookingId, Guid studentId);
    }

    public class BookingService : IBookingService
    {
        private readonly ApplicationDbContext _db;

        public BookingService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<(bool success, string error, Booking? booking)> CreateBookingAsync(Guid studentId, Guid tripId, string route, string company, string destination, string date, string? time, string? pickup, string? seat, string refId, string? amount, decimal? priceNum)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var trip = await _db.Trips.FindAsync(tripId);
                if (trip == null || trip.Status != "active")
                    return (false, "Trip is not available.", null);

                if (trip.AvailableSeats <= 0)
                    return (false, "No seats available.", null);

                // Decrement seats
                trip.AvailableSeats -= 1;

                var booking = new Booking
                {
                    StudentId = studentId,
                    TripId = tripId,
                    VendorId = trip.VendorId,
                    Route = route,
                    Company = company,
                    Destination = destination,
                    VehicleType = trip.VehicleType,
                    Date = date,
                    Time = time,
                    Pickup = pickup,
                    Seat = seat,
                    Ref = refId,
                    Amount = amount,
                    PriceNum = priceNum,
                    Status = "pending"
                };

                _db.Bookings.Add(booking);
                await _db.SaveChangesAsync();
                
                await transaction.CommitAsync();
                
                return (true, string.Empty, booking);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return (false, "An error occurred while creating booking.", null);
            }
        }

        public async Task<(bool success, string error)> CancelBookingAsync(Guid bookingId, Guid studentId)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var booking = await _db.Bookings.FindAsync(bookingId);
                if (booking == null || booking.StudentId != studentId)
                    return (false, "Booking not found.");

                if (booking.Status == "cancelled")
                    return (false, "Booking is already cancelled.");

                booking.Status = "cancelled";

                if (booking.TripId.HasValue)
                {
                    var trip = await _db.Trips.FindAsync(booking.TripId.Value);
                    if (trip != null)
                    {
                        trip.AvailableSeats += 1;
                    }
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return (true, string.Empty);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return (false, "An error occurred while cancelling booking.");
            }
        }
    }
}
