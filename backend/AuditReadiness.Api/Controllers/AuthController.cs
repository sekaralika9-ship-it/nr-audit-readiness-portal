using AuditReadiness.Api;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditReadiness.Api.Controllers;

[ApiController, Route("api/v1/auth"), Authorize]
public sealed class AuthController : ControllerBase
{
    [HttpGet("me")]
    public ActionResult<ApiResponse<object>> Me() => Ok(ApiResponse<object>.Ok(new
    {
        userId = User.ToUserContext().UserId,
        email = User.ToUserContext().Email,
        roles = User.ToUserContext().Roles
    }));
}
