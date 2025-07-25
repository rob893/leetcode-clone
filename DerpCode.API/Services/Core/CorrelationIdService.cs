using System;

namespace DerpCode.API.Services.Core;

public sealed class CorrelationIdService : ICorrelationIdService
{
    private string? correlationId;

    public string CorrelationId
    {
        get
        {
            this.correlationId ??= Guid.NewGuid().ToString();

            return this.correlationId;
        }

        set => this.correlationId = value;
    }
}