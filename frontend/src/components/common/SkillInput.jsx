// src/components/common/SkillInput.jsx
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { skillsList } from '../../data/skillsList';

const SkillInput = ({ 
    skills, 
    onChange, 
    placeholder, 
    maxSkills = 10,
    bgColor = "blue" 
  }) => {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (search) {
      const filtered = skillsList
        .filter(skill => 
          skill.toLowerCase().includes(search.toLowerCase()) && 
          !skills.includes(skill)
        )
        .slice(0, 5); // Show only top 5 matches
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  }, [search, skills]);

  const handleSkillAdd = (skill) => {
    if (skills.length < maxSkills) {
      onChange([...skills, skill]);
      setSearch('');
      setShowDropdown(false);
      inputRef.current?.focus();
    }
  };

  const handleSkillRemove = (indexToRemove) => {
    onChange(skills.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredSkills.length > 0) {
      e.preventDefault();
      handleSkillAdd(filteredSkills[0]);
    }
  };

  const renderDropdown = () => {
    if (!showDropdown || !filteredSkills.length) return null;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const dropdownStyles = {
      position: 'fixed',
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 99999
    };

    return createPortal(
      <div style={dropdownStyles}>
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSkills.map((skill, index) => (
            <button
              key={index}
              onClick={() => handleSkillAdd(skill)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {skill}
            </button>
          ))}
        </div>
      </div>,
      document.getElementById('dropdown-portal')
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white dark:bg-gray-700 min-h-[56px]">
        {skills.map((skill, index) => (
          <div 
            key={index}
            className={`group flex items-center gap-2 px-3 py-1.5 
              ${bgColor === "blue" ? "bg-blue-100 dark:bg-blue-900" : "bg-green-100 dark:bg-green-900"}
              rounded-lg`}
          >
            <span className="text-sm font-medium">{skill}</span>
            <button
              onClick={() => handleSkillRemove(index)}
              className="hidden group-hover:block p-1 hover:text-red-500 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {skills.length < maxSkills && (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={skills.length === 0 ? placeholder : "Add more skills..."}
            className="flex-1 min-w-[200px] p-2 text-sm bg-transparent outline-none"
          />
        )}
      </div>
      {renderDropdown()}
      {/* Max skills indicator */}
      <div className="mt-1 text-xs text-gray-500">
        {skills.length}/{maxSkills} skills maximum
      </div>
    </div>
  );
};

export default SkillInput;