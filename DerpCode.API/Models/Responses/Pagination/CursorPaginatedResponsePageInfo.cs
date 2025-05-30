namespace DerpCode.API.Models.Responses.Pagination;

/// <summary>
/// The page info for a cursor paginated response.
/// </summary>
public sealed record CursorPaginatedResponsePageInfo
{
    /// <summary>
    /// Gets the start cursor for a cursor paginated response.
    /// </summary>
    public string? StartCursor { get; init; }

    /// <summary>
    /// Gets the end cursor for a cursor paginated response.
    /// </summary>
    public string? EndCursor { get; init; }

    /// <summary>
    /// Gets a value indicating whether there is a next page or not.
    /// </summary>
    public required bool HasNextPage { get; init; }

    /// <summary>
    /// Gets a value indicating whether there is a previous page or not.
    /// </summary>
    public required bool HasPreviousPage { get; init; }

    /// <summary>
    /// Gets the number of results for the current page.
    /// </summary>
    public required int PageCount { get; init; }

    /// <summary>
    /// Gets the total count of all results in all pages.
    /// </summary>
    public int? TotalCount { get; init; }
}