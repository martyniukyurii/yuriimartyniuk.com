"use client";

import React, { useEffect, useState, SVGProps } from "react";
import { IconArticle, IconTag } from "@tabler/icons-react";

import BlogPostCard from "../blog/blog-post-card";

import { IPost } from "@/app/models/Post";

import '@/styles/blog.css';
import { Pagination, PaginationItemType, PaginationItemRenderProps, cn } from "@heroui/react";

import { useTranslation } from "@/lib/hooks/useTranslation";

// Компонент іконки для пагінації
const ChevronIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M15.5 19l-7-7 7-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export function BlogSection() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const { t } = useTranslation();

  // Отримуємо параметри з URL при завантаженні компонента
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const tagParam = url.searchParams.get('tag');

      if (tagParam) {
        setSelectedTag(tagParam);
      }
      
      const pageParam = url.searchParams.get('page');

      if (pageParam) {
        setPage(parseInt(pageParam, 10));
      }
    }
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = `/api/posts?page=${page}&limit=3`;
      
      if (selectedTag) {
        url += `&tag=${selectedTag}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Не вдалося завантажити дані');
      }
      
      const data = await response.json();

      setPosts(data.posts);
      setTotalPages(data.metadata.totalPages);
    } catch (err) {
      console.error('Помилка при завантаженні постів:', err);
      setError('Не вдалося завантажити пости');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      
      if (!response.ok) {
        throw new Error('Не вдалося завантажити теги');
      }
      
      const data = await response.json();

      setTags(data.tags);
    } catch (err) {
      console.error('Помилка при завантаженні тегів:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, [page, selectedTag]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    
    // Оновлюємо URL з новим параметром page
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);

      url.searchParams.set('page', newPage.toString());
      window.history.pushState({}, '', url.toString());
    }
  };
  
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      // Оновлюємо URL, видаляючи параметр tag
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);

        url.searchParams.delete('tag');
        window.history.pushState({}, '', url.toString());
      }
    } else {
      setSelectedTag(tag);
      // Оновлюємо URL з новим параметром tag
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);

        url.searchParams.set('tag', tag);
        window.history.pushState({}, '', url.toString());
      }
    }
    setPage(1);
  };
  
  // Функція для відображення повідомлення про відсутність постів з вибраним тегом
  const getNoPostsMessage = () => {
    if (selectedTag) {
      return `${t('blog.no.posts.with.tag').replace('{{tag}}', `"${selectedTag}"`)}`;
    }

    return t('blog.no.posts.to.display');
  };
  
  // Кастомний рендер елементів пагінації
  const renderItem = ({
    ref,
    key,
    value,
    isActive,
    onNext,
    onPrevious,
    setPage,
    className,
  }: PaginationItemRenderProps) => {
    if (value === PaginationItemType.NEXT) {
      return (
        <button
          key={key}
          className={cn(className, "bg-default-200/50 min-w-8 w-8 h-8")}
          onClick={onNext}
        >
          <ChevronIcon className="rotate-180" />
        </button>
      );
    }

    if (value === PaginationItemType.PREV) {
      return (
        <button
          key={key}
          className={cn(className, "bg-default-200/50 min-w-8 w-8 h-8")}
          onClick={onPrevious}
        >
          <ChevronIcon />
        </button>
      );
    }

    if (value === PaginationItemType.DOTS) {
      return (
        <button key={key} className={className}>
          ...
        </button>
      );
    }

    // cursor is the default item
    return (
      <button
        key={key}
        ref={ref}
        className={cn(
          className,
          isActive && "text-white bg-gradient-to-br from-violet-500 to-purple-600 font-bold",
        )}
        onClick={() => setPage(value)}
      >
        {value}
      </button>
    );
  };

  return (
    <section className="min-h-screen flex items-center justify-center" id="blog">
      <div className="max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="flex items-center justify-center mb-8">
          <IconArticle className="w-8 h-8 mr-2 text-violet-600 dark:text-violet-400" />
          <h2 className="blog-title text-4xl font-bold">{t('blog.title')}</h2>
        </div>
        
        {/* Відображення тегів для фільтрації */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {tags.map(tag => (
              <button
                key={tag} 
                className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors duration-300 ${
                  selectedTag === tag
                    ? 'bg-violet-500 text-white'
                    : 'blog-tag'
                }`}
                onClick={() => handleTagClick(tag)}
              >
                <IconTag className="w-3 h-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        )}
        
        {selectedTag && (
          <div className="mb-6 text-center">
            <button
              className="px-3 py-1.5 blog-nav-button rounded-md text-sm"
              onClick={() => handleTagClick(selectedTag)}
            >
              {t('blog.clear.filter')} "{selectedTag}"
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center blog-text p-4">
            {getNoPostsMessage()}
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <BlogPostCard 
                key={post._id?.toString() || post.messageId?.toString() || post.telegramId?.toString() || Math.random().toString()} 
                post={post} 
              />
            ))}
          </div>
        )}
        
        {!loading && posts.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              disableCursorAnimation
              showControls
              className="gap-2"
              initialPage={page}
              radius="full"
              renderItem={renderItem}
              total={totalPages}
              variant="light"
              onChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </section>
  );
} 