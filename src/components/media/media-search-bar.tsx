// Media search bar component with advanced search and filter capabilities

import { useState } from "react";
import { Search, Filter, X, Film, Music, Image, File } from "lucide-react";
import { Button } from "../ui/button";

interface MediaSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const filterOptions = [
  { value: "all", label: "All Files", icon: File },
  { value: "video", label: "Videos", icon: Film },
  { value: "audio", label: "Audio", icon: Music },
  { value: "image", label: "Images", icon: Image },
];

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "date", label: "Date Added" },
  { value: "size", label: "File Size" },
  { value: "duration", label: "Duration" },
];

export function MediaSearchBar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  sortBy,
  onSortChange
}: MediaSearchBarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const activeFilters = [
    filterType !== "all" && filterType,
    searchQuery && "search",
    sortBy !== "name" && "sort"
  ].filter(Boolean);

  const clearFilters = () => {
    onSearchChange("");
    onFilterChange("all");
    onSortChange("name");
  };

  return (
    <div className="media-search-bar">
      <div className="search-input-wrapper">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search media files..."
          className="search-input"
        />
        {searchQuery && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSearchChange("")}
            className="clear-search-btn"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      <div className="search-controls">
        <div className="filter-group">
          {filterOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={filterType === value ? "default" : "secondary"}
              size="sm"
              onClick={() => onFilterChange(value)}
              className={`filter-btn ${filterType === value ? "active" : ""}`}
            >
              <Icon size={16} />
              <span className="filter-label">{label}</span>
            </Button>
          ))}
        </div>

        <div className="sort-group">
          <span className="sort-label">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="sort-select"
          >
            {sortOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {activeFilters.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={clearFilters}
            className="clear-filters-btn"
          >
            <X size={16} />
            Clear Filters
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`advanced-filters-btn ${showAdvancedFilters ? "active" : ""}`}
        >
          <Filter size={16} />
          Advanced
        </Button>
      </div>

      {showAdvancedFilters && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-field">
              <label>Date Range</label>
              <div className="date-range">
                <input
                  type="date"
                  className="date-input"
                  placeholder="From"
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  className="date-input"
                  placeholder="To"
                />
              </div>
            </div>

            <div className="filter-field">
              <label>File Size</label>
              <div className="size-range">
                <select className="size-select">
                  <option value="">Any size</option>
                  <option value="small">&lt; 10 MB</option>
                  <option value="medium">10 MB - 100 MB</option>
                  <option value="large">100 MB - 1 GB</option>
                  <option value="xlarge">&gt; 1 GB</option>
                </select>
              </div>
            </div>

            <div className="filter-field">
              <label>Duration</label>
              <div className="duration-range">
                <select className="duration-select">
                  <option value="">Any duration</option>
                  <option value="short">&lt; 1 min</option>
                  <option value="medium">1-10 min</option>
                  <option value="long">10-60 min</option>
                  <option value="xlong">&gt; 1 hour</option>
                </select>
              </div>
            </div>

            <div className="filter-field">
              <label>Compatibility</label>
              <div className="compatibility-filters">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span className="checkmark"></span>
                  Direct Play
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span className="checkmark"></span>
                  Transcode
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Unsupported
                </label>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <Button variant="secondary" size="sm">
              Reset to Default
            </Button>
            <Button variant="default" size="sm">
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}