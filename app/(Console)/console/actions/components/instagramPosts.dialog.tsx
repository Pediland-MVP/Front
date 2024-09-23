'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import InfiniteScroll from 'react-infinite-scroll-component';

const PAGE_SIZE = 9;

const InstagramPostsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [after, setAfter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = async (afterCursor: string | null = null) => {
    setIsLoading(true);
    try {
      const url = afterCursor
        ? `http://localhost:3001/v1/medias/posts?after=${afterCursor}`
        : `http://localhost:3001/v1/medias/posts`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();

      if (!response.ok) {
        console.error('Error fetching posts:', response.statusText);
        return;
      }

      setPosts((prevPosts) => [...prevPosts, ...data.media.data]);
      setHasMore(data.media.data.length === PAGE_SIZE);
      setAfter(data.media.paging.cursors.after || null);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPosts([]);
      setAfter(null);
      fetchPosts();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">انتخاب پست</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50rem]">
        <DialogHeader>
          <DialogTitle>انتخاب پست</DialogTitle>
          <DialogDescription>
            آخرین پست‌های اینستاگرام خود را مشاهده کنید.
          </DialogDescription>
        </DialogHeader>
        <InfiniteScroll
          dataLength={posts.length}
          next={() => fetchPosts(after)}
          hasMore={hasMore}
          loader={<p>در حال بارگذاری...</p>}
          endMessage={<p>پست دیگری موجود نیست.</p>}
          scrollableTarget="scrollableDiv"
        >
          <div className="grid grid-cols-3 gap-4" id="scrollableDiv" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {Array.isArray(posts) && posts.map((post) => (
              <div key={post.id} className="col-span-1">
                <div className="relative w-full h-56 hover:opacity-70">
                  <Image
                    className="rounded-sm"
                    src={post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url}
                    alt={post.caption || "Instagram Post"}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </InfiniteScroll>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>بستن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramPostsDialog;
