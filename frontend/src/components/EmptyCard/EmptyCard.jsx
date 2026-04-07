import React from "react";
import { MdSearchOff } from "react-icons/md";

const EmptySearch = ({ query }) => {
  return (
    <div className="flex flex-col items-center justify-center mt-20 text-center">
      
      <MdSearchOff className="text-6xl text-gray-400 mb-4" />

      <h2 className="text-xl font-semibold text-gray-700">
        No Results Found 🔍
      </h2>

      <p className="text-gray-500 mt-2 max-w-sm">
        No notes found for "<b>{query}</b>". Try searching with different keywords.
      </p>

    </div>
  );
};

export default EmptySearch;