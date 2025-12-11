/**
 * Comment System Example
 *
 * This is a reference implementation showing how to use the comment system
 * in an article editor or review interface.
 */

import { useState } from 'react';
import { CommentSection } from './CommentSection';
import { createCommentService } from '@content-engine/publishing';
import { GlassCard } from '../components/GlassCard';

export function CommentSystemExample() {
  const [commentService] = useState(() => createCommentService());

  // Mock current user - replace with real auth context
  const currentUserId = 'demo-user-123';

  // Mock article - replace with real article data
  const articleId = 'demo-article-456';

  return (
    <div className="min-h-screen bg-void-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Comment System Example
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Article content (left column) */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                How to Build a Scalable Content Platform
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300">
                  Building a content platform requires careful consideration of
                  scalability, performance, and user experience. In this
                  article, we'll explore the key architectural decisions that
                  enable platforms to grow from hundreds to millions of users.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">
                  1. Database Architecture
                </h3>
                <p className="text-slate-300">
                  The foundation of any scalable platform is its database
                  architecture. We recommend using Supabase for its powerful
                  Row-Level Security and real-time capabilities.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">
                  2. Multi-Tenancy
                </h3>
                <p className="text-slate-300">
                  Implementing proper tenant isolation is crucial for security
                  and performance. Each tenant should have its own data space
                  while sharing the same infrastructure.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6 mb-3">
                  3. Content Generation
                </h3>
                <p className="text-slate-300">
                  Leveraging multiple AI providers allows for redundancy and
                  cost optimization. Our platform supports Grok, Claude, and
                  StealthGPT for different use cases.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Article Metadata
              </h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="text-white font-medium">Draft</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Author</dt>
                  <dd className="text-white font-medium">Sarah Chen</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Category</dt>
                  <dd className="text-white font-medium">
                    Software Architecture
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Word Count</dt>
                  <dd className="text-white font-medium">1,247 words</dd>
                </div>
              </dl>
            </GlassCard>
          </div>

          {/* Comments sidebar (right column) */}
          <div className="lg:col-span-1">
            <CommentSection
              articleId={articleId}
              currentUserId={currentUserId}
              commentService={commentService}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommentSystemExample;
