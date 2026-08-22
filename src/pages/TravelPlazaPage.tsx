import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import { PageContainer } from '@/components/PageContainer';
import {
  fetchTravelPosts,
  createTravelPost,
  deleteTravelPost,
  TravelPostRow,
} from '@/lib/supabase';
import { ArrowLeft, Plus, Trash2, X } from '@/components/Icons';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function TravelPlazaPage() {
  const { setCurrentPage } = useApp();
  const { user } = useAuth();

  const [posts, setPosts] = useState<TravelPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<TravelPostRow | null>(null);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const data = await fetchTravelPosts();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleOpenNewEditor = () => {
    setEditTitle('');
    setEditContent('');
    setShowEditor(true);
  };

  const handleSavePost = async () => {
    if (!editTitle.trim() || !editContent.trim() || !user) return;
    setSaving(true);
    const created = await createTravelPost(editTitle.trim(), editContent.trim(), user.nickname);
    if (created) {
      setShowEditor(false);
      await loadPosts();
    }
    setSaving(false);
  };

  const handleDeletePost = async (postId: string) => {
    const ok = await deleteTravelPost(postId);
    if (ok) {
      setDeletePostId(null);
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
      await loadPosts();
    }
  };

  // --- Detail view ---
  if (selectedPost) {
    return (
      <PageContainer className="bg-base">
        <div className="flex-1">
          <div className="px-6 pt-10 pb-10">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setSelectedPost(null)}
                className="flex items-center gap-1.5 font-sans text-sm text-text-sub hover:text-text transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                목록으로
              </button>
              <span className="font-playfair text-sm font-bold tracking-[0.12em] text-text-sub">MERRIWEATHER</span>
            </div>

            <article className="mb-8 animate-fadeUp">
              <h1 className="font-batang text-2xl text-text mb-3 leading-snug">{selectedPost.title}</h1>
              <div className="flex items-center gap-2 mb-6">
                <span className="font-sans text-xs text-text-sub">{selectedPost.nickname}</span>
                <span className="font-sans text-xs text-text-sub">·</span>
                <span className="font-sans text-xs text-text-sub">{formatDate(selectedPost.created_at)}</span>
              </div>
              <div className="font-batang text-sm text-text leading-loose whitespace-pre-line">
                {selectedPost.content}
              </div>
            </article>

            {user && user.id === selectedPost.user_id && (
              <button
                onClick={() => setDeletePostId(selectedPost.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-[#E0DDD8] rounded-xl font-sans text-sm text-text-sub hover:border-error hover:text-error transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            )}
          </div>
        </div>

        {deletePostId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletePostId(null)} />
            <div className="relative w-full max-w-sm bg-base rounded-3xl shadow-2xl border border-[#E0DDD8] animate-scaleIn p-6 text-center">
              <h2 className="font-batang text-xl text-text mb-2">글을 삭제할까요?</h2>
              <p className="font-sans text-sm text-text-sub mb-6">삭제된 글은 복구할 수 없어요.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletePostId(null)}
                  className="flex-1 py-3.5 bg-white border border-[#E0DDD8] rounded-xl font-sans text-sm text-text-sub hover:bg-[#F0F0EE] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDeletePost(deletePostId)}
                  className="flex-1 py-3.5 bg-error text-white rounded-xl font-sans text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    );
  }

  // --- List view ---
  return (
    <PageContainer className="bg-base">
      <div className="flex-1">
        <div className="px-6 pt-10 pb-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setCurrentPage('landing')}
              className="font-batang text-lg text-text hover:text-point transition-colors"
            >
              MERRIWEATHER
            </button>
            <span className="font-sans text-sm text-text-sub">여행자 광장</span>
          </div>

          {/* Intro message */}
          <div className="p-5 bg-point/5 rounded-2xl border border-point/15 mb-8 animate-fadeUp">
            <p className="font-batang text-base text-text mb-2 leading-relaxed">
              메리웨더 여행은 어떠셨나요? 🌟
            </p>
            <p className="font-sans text-sm text-text-sub leading-relaxed">
              여행 후기, 주민 소감, 건의사항 등 무엇이든 자유롭게 남겨주세요.
            </p>
            <p className="font-sans text-sm text-text-sub leading-relaxed">
              여러분의 이야기가 메리웨더를 더 좋은 곳으로 만들어요 :)
            </p>
          </div>

          {/* Title + write button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-batang text-2xl text-text animate-fadeUp">여행자 광장</h1>
            {user && (
              <button
                onClick={handleOpenNewEditor}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-point text-white rounded-xl font-sans text-sm font-medium transition-all duration-300 hover:bg-point-dark active:scale-95"
              >
                <Plus className="w-4 h-4" />
                글쓰기
              </button>
            )}
          </div>

          {/* Post list */}
          {loading ? (
            <p className="font-sans text-sm text-text-sub text-center py-12">불러오는 중...</p>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-batang text-base text-text-sub">아직 작성된 글이 없어요.</p>
              {user && (
                <p className="font-sans text-sm text-text-sub mt-2">첫 번째 글을 작성해보세요.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="w-full text-left p-5 bg-white rounded-2xl border border-[#E0DDD8] shadow-sm hover:border-point hover:shadow-md transition-all duration-300 animate-fadeUp"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <h2 className="font-batang text-lg text-text mb-2 leading-snug">{post.title}</h2>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-sans text-xs text-text-sub">{post.nickname}</span>
                    <span className="font-sans text-xs text-text-sub">·</span>
                    <span className="font-sans text-xs text-text-sub">{formatDate(post.created_at)}</span>
                  </div>
                  <p
                    className="font-sans text-sm text-text-sub leading-relaxed overflow-hidden whitespace-pre-line"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                  >
                    {post.content}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Non-login notice */}
          {!user && (
            <p className="font-sans text-sm text-text-sub text-center mt-10 leading-relaxed">
              메리웨더 주민이 되면 이곳에 이야기를 남길 수 있어요
            </p>
          )}

          {/* Footer notice */}
          <p className="font-sans text-xs text-text-sub text-center mt-10 leading-relaxed">
            서비스 문의 및 환불은 문의하기를 이용해주세요.
          </p>
        </div>
      </div>

      {/* Editor modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative mx-4 mb-4 sm:mb-0 w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-scaleIn">
            <button
              onClick={() => setShowEditor(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F0F0EE] flex items-center justify-center text-text-sub hover:bg-[#E0DDD8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-batang text-xl text-text mb-5">새 글 작성</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목"
                className="w-full box-border px-4 py-3 text-sm font-sans text-text bg-base rounded-xl border border-[#E0DDD8] focus:border-point focus:outline-none transition-colors"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="내용"
                rows={8}
                className="w-full box-border px-4 py-3 text-sm font-sans text-text bg-base rounded-xl border border-[#E0DDD8] focus:border-point focus:outline-none transition-colors resize-none"
              />
              <button
                onClick={handleSavePost}
                disabled={saving || !editTitle.trim() || !editContent.trim()}
                className="w-full py-3.5 bg-point text-white rounded-xl font-sans font-medium text-sm transition-all duration-300 hover:bg-point-dark active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '작성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
