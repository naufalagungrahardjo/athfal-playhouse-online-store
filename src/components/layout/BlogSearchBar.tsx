
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBlogs, Blog } from "@/hooks/useBlogs";
import { cn } from "@/lib/utils";

export const BlogSearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Blog[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { blogs } = useBlogs();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input for async search filtering
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      const lowercaseQuery = query.toLowerCase();
      const results = blogs.filter(blog =>
        blog.title.toLowerCase().includes(lowercaseQuery) ||
        (blog.content && blog.content.toLowerCase().includes(lowercaseQuery))
      ).slice(0, 6); // limit suggestions
      setSuggestions(results);
      setShowDropdown(true);
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, blogs]);

  // Hide dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const handleSelect = (blogId: string) => {
    setQuery("");
    setShowDropdown(false);
    navigate(`/blog/${blogId}`);
  };

  return (
    <div className="relative w-48 md:w-56">
      <div className="flex items-center bg-white border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-athfal-pink">
        <Search className="ml-2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          className="flex-1 border-none shadow-none focus:ring-0 focus-visible:ring-0 py-2 px-2 text-sm"
          placeholder="Search blogs..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          autoComplete="off"
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-50">
          {suggestions.map((blog) => (
            <button
              key={blog.id}
              className={cn(
                "w-full px-2 py-2 flex items-start space-x-3 hover:bg-athfal-pink/10 focus:bg-athfal-pink/20 transition-colors cursor-pointer"
              )}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(blog.id); }}
              tabIndex={-1}
            >
              {/* Blog image thumbnail */}
              <img
                src={blog.image}
                alt={blog.title}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0 bg-gray-100 border"
              />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{blog.title}</span>
                  {blog.category && (
                    <span className="ml-2 px-2 py-0.5 bg-athfal-peach/40 text-xs text-athfal-pink font-semibold rounded">{blog.category}</span>
                  )}
                </div>
                {/* Date and author metadata */}
                <div className="text-xs text-gray-500">
                  <span>{blog.date}</span>
                  {blog.author && <> · <span>{blog.author}</span></>}
                </div>
                {/* Content snippet with highlight */}
                <div className="text-xs text-gray-700 mt-1 line-clamp-2">
                  {blog.content
                    .replace(/<[^>]+>/g, "")
                    .split(" ")
                    .slice(0, 26)
                    .join(" ")
                  }
                  {blog.content.replace(/<[^>]+>/g, "").split(" ").length > 26
                    ? "..." : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {showDropdown && isLoading && (
        <div className="absolute left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-50 px-4 py-2 text-gray-400 text-sm">Searching...</div>
      )}
      {showDropdown && !isLoading && suggestions.length === 0 && (
        <div className="absolute left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-50 px-4 py-2 text-gray-400 text-sm">No results</div>
      )}
    </div>
  );
};
