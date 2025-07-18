using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using DerpCode.API.Core;
using DerpCode.API.Data.Repositories;
using DerpCode.API.Models.Dtos;
using DerpCode.API.Models.QueryParameters;
using DerpCode.API.Models.Requests;
using DerpCode.API.Services.Auth;

namespace DerpCode.API.Services.Domain;

/// <summary>
/// Service for managing driver template-related business logic
/// </summary>
public sealed class ArticleService : IArticleService
{
    private readonly IArticleRepository articleRepository;

    private readonly ICurrentUserService currentUserService;

    public ArticleService(IArticleRepository articleRepository, ICurrentUserService currentUserService)
    {
        this.articleRepository = articleRepository ?? throw new ArgumentNullException(nameof(articleRepository));
        this.currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    /// <inheritdoc />
    public async Task<CursorPaginatedList<ArticleDto, int>> GetArticlesAsync(CursorPaginationQueryParameters searchParams, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(searchParams);

        var pagedList = await this.articleRepository.SearchAsync(searchParams, track: false, cancellationToken);
        var mapped = pagedList
            .Select(ArticleDto.FromEntity)
            .ToList();

        return new CursorPaginatedList<ArticleDto, int>(mapped, pagedList.HasNextPage, pagedList.HasPreviousPage, pagedList.StartCursor, pagedList.EndCursor, pagedList.TotalCount);
    }

    /// <inheritdoc />
    public async Task<ArticleDto?> GetArticleByIdAsync(int id, CancellationToken cancellationToken)
    {
        var article = await this.articleRepository.GetByIdAsync(id, track: false, cancellationToken);

        if (article == null)
        {
            return null;
        }

        return ArticleDto.FromEntity(article);
    }

    /// <inheritdoc />
    public async Task<CursorPaginatedList<ArticleCommentDto, int>> GetArticleCommentsAsync(ArticleCommentQueryParameters searchParams, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(searchParams);

        var pagedList = await this.articleRepository.SearchArticleCommentsAsync(searchParams, track: false, cancellationToken);
        var mapped = pagedList
            .Select(ArticleCommentDto.FromEntity)
            .ToList();

        return new CursorPaginatedList<ArticleCommentDto, int>(mapped, pagedList.HasNextPage, pagedList.HasPreviousPage, pagedList.StartCursor, pagedList.EndCursor, pagedList.TotalCount);
    }

    /// <inheritdoc />
    public async Task<ArticleCommentDto?> GetArticleCommentByIdAsync(int id, CancellationToken cancellationToken)
    {
        var comment = await this.articleRepository.GetArticleCommentByIdAsync(id, track: false, cancellationToken);

        if (comment == null)
        {
            return null;
        }

        return ArticleCommentDto.FromEntity(comment);
    }

    /// <inheritdoc />
    public async Task<Result<ArticleCommentDto>> CreateCommentAsync(int articleId, CreateArticleCommentRequest createCommentRequest, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(createCommentRequest);

        if (!this.currentUserService.EmailVerified)
        {
            return Result<ArticleCommentDto>.Failure(DomainErrorType.Validation, "Email must be verified to create a comment.");
        }

        var article = await this.articleRepository.GetByIdAsync(articleId, track: true, cancellationToken);

        if (article == null)
        {
            return Result<ArticleCommentDto>.Failure(DomainErrorType.NotFound, $"Article with ID {articleId} not found.");
        }

        var newComment = createCommentRequest.ToEntity(this.currentUserService.UserId, articleId);
        article.Comments.Add(newComment);

        if (createCommentRequest.ParentCommentId.HasValue)
        {
            var parentCommentId = createCommentRequest.ParentCommentId ?? throw new InvalidOperationException("ParentCommentId must be provided.");
            var parentComment = await this.articleRepository.GetArticleCommentByIdAsync(parentCommentId, track: true, cancellationToken);

            if (parentComment == null)
            {
                return Result<ArticleCommentDto>.Failure(DomainErrorType.NotFound, $"Parent comment with ID {parentCommentId} not found.");
            }

            if (parentComment.ArticleId != articleId)
            {
                return Result<ArticleCommentDto>.Failure(DomainErrorType.Validation, "Parent comment does not belong to the same article.");
            }

            if (parentComment.ParentCommentId.HasValue)
            {
                return Result<ArticleCommentDto>.Failure(DomainErrorType.Validation, "Cannot reply to a reply comment.");
            }

            parentComment.RepliesCount++;
        }

        var updated = await this.articleRepository.SaveChangesAsync(cancellationToken);

        if (updated <= 0)
        {
            return Result<ArticleCommentDto>.Failure(DomainErrorType.Unknown, "Failed to create article comment.");
        }

        var dto = ArticleCommentDto.FromEntity(newComment);
        var withUserName = dto with { UserName = this.currentUserService.UserName };

        return Result<ArticleCommentDto>.Success(withUserName);
    }
}