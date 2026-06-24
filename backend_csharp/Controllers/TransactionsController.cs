using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniRide.Api.Data;
using UniRide.Api.Data.Models;
using System;
using System.Linq;

namespace UniRide.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public TransactionsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("student/{studentId}")]
        public async Task<IActionResult> GetStudentTransactions(Guid studentId)
        {
            var txs = await _db.Transactions
                .Where(t => t.StudentId == studentId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
            return Ok(txs);
        }

        [HttpGet("vendor/{vendorId}")]
        public async Task<IActionResult> GetVendorTransactions(Guid vendorId)
        {
            var txs = await _db.Transactions
                .Where(t => t.VendorId == vendorId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
            return Ok(txs);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] Transaction tx)
        {
            _db.Transactions.Add(tx);
            await _db.SaveChangesAsync();
            return Ok(tx);
        }
    }
}
