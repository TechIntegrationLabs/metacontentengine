# Comment System

Internal commenting system for article collaboration with thread support, mentions, and resolution tracking.

## Components

### CommentSection

Main container component that manages the entire comment interface.

```tsx
import { CommentSection } from '@content-engine/ui';
import { createCommentService } from '@content-engine/publishing';

const commentService = createCommentService();

<CommentSection
  articleId="article-123"
  currentUserId="user-456"
  commentService={commentService}
/>
```

**Features:**
- Add new comments
- Filter by resolved/unresolved
- Filter by mentions
- Sort by newest/oldest
- Real-time comment counts

### CommentThread

Displays a comment and its replies with collapsible thread view.

```tsx
import { CommentThread } from '@content-engine/ui';

<CommentThread
  thread={thread}
  currentUserId="user-123"
  onReply={handleReply}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onResolve={handleResolve}
  defaultExpanded={true}
/>
```

### CommentItem

Individual comment with actions and inline editing.

```tsx
import { CommentItem } from '@content-engine/ui';

<CommentItem
  comment={comment}
  currentUserId="user-123"
  onReply={handleReply}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onResolve={handleResolve}
  showReplyButton={true}
  isReply={false}
/>
```

**Features:**
- Author avatar (auto-generated if no image)
- @mention highlighting
- Relative timestamps
- Edit/delete (own comments only)
- Resolve/unresolve (root comments only)
- Inline reply form

### CommentForm

Rich text input with mention support and keyboard shortcuts.

```tsx
import { CommentForm } from '@content-engine/ui';

<CommentForm
  onSubmit={(content, mentions) => console.log(content, mentions)}
  onCancel={() => setIsReplying(false)}
  placeholder="Add a comment..."
  submitLabel="Comment"
  autoFocus={true}
  maxLength={2000}
/>
```

**Keyboard Shortcuts:**
- `Cmd/Ctrl + Enter` - Submit comment
- `Escape` - Cancel (if onCancel provided)
- `@` - Trigger mention picker (coming soon)

## Service

### CommentService

Backend service for comment CRUD operations.

```tsx
import { createCommentService, CommentService } from '@content-engine/publishing';

const service: CommentService = createCommentService();

// Create comment
await service.createComment({
  articleId: 'article-123',
  content: 'Great article! @john check this out',
  mentions: ['user-john-id'],
});

// Create reply
await service.createComment({
  articleId: 'article-123',
  parentId: 'comment-456',
  content: 'Thanks for the feedback!',
});

// Update comment
await service.updateComment({
  commentId: 'comment-789',
  content: 'Updated content',
  mentions: [],
});

// Resolve comment
await service.resolveComment({
  commentId: 'comment-789',
  resolved: true,
});

// Delete comment (and all replies)
await service.deleteComment('comment-789');

// Get comment threads
const threads = await service.getCommentThreads({
  articleId: 'article-123',
  showResolved: false,
  showOnlyMentions: false,
});
```

## Types

```tsx
import type {
  ArticleComment,
  CommentThread,
  CreateCommentRequest,
  UpdateCommentRequest,
  ResolveCommentRequest,
  CommentFilters,
  CommentSortOrder,
  CommentNotification,
} from '@content-engine/types';
```

## Styling

Uses the Frosted Obsidian design system:

- Glass cards with subtle transparency
- Indented replies with left border accent
- Resolved comments shown with strikethrough and opacity
- @mentions highlighted in forge-accent color
- Hover states with glass morphism effects

## Integration Example

```tsx
import { useState, useEffect } from 'react';
import { CommentSection } from '@content-engine/ui';
import { createCommentService } from '@content-engine/publishing';

export function ArticleEditor({ articleId }: { articleId: string }) {
  const [commentService] = useState(() => createCommentService());
  const currentUserId = 'user-123'; // Get from auth context

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Article editor */}
      <div className="col-span-2">
        {/* TipTap editor here */}
      </div>

      {/* Comments sidebar */}
      <div className="col-span-1">
        <CommentSection
          articleId={articleId}
          currentUserId={currentUserId}
          commentService={commentService}
        />
      </div>
    </div>
  );
}
```

## Future Enhancements

- [ ] Real-time notifications via Supabase Realtime
- [ ] @mention autocomplete with user search
- [ ] Rich text formatting in comments
- [ ] Comment attachments (images, files)
- [ ] Comment reactions (emoji)
- [ ] Comment search
- [ ] Export comment thread as PDF
- [ ] Supabase backend integration (currently in-memory)
- [ ] Comment analytics (response time, resolution rate)
- [ ] Assignees for comments

## Database Schema (Supabase)

```sql
-- Comments table
CREATE TABLE article_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES tenants(id)
);

-- Comment notifications
CREATE TABLE comment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment_id UUID NOT NULL REFERENCES article_comments(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'resolution')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID NOT NULL REFERENCES tenants(id)
);

-- Indexes
CREATE INDEX idx_comments_article ON article_comments(article_id);
CREATE INDEX idx_comments_parent ON article_comments(parent_id);
CREATE INDEX idx_comments_author ON article_comments(author_id);
CREATE INDEX idx_comments_tenant ON article_comments(tenant_id);
CREATE INDEX idx_notifications_user ON comment_notifications(user_id, read);

-- RLS policies
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their tenant"
  ON article_comments FOR SELECT
  USING (tenant_id = auth.tenant_id());

CREATE POLICY "Users can create comments in their tenant"
  ON article_comments FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id() AND author_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON article_comments FOR UPDATE
  USING (author_id = auth.uid() AND tenant_id = auth.tenant_id());

CREATE POLICY "Users can delete own comments"
  ON article_comments FOR DELETE
  USING (author_id = auth.uid() AND tenant_id = auth.tenant_id());
```
