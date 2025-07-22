"use client";

import { useState } from "react";
import { MoreHorizontal, Award, TrendingUp, TrendingDown, Crown, Medal, Trophy } from "lucide-react";
import { TopPerformer } from "@/data/mockAnalytics";

interface TopPerformersCardProps {
  performers: TopPerformer[];
  title: string;
  period: string;
}

export function TopPerformersCard({ performers, title, period }: TopPerformersCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    console.log(`Performers action: ${action}`);
    // TODO: Implement performers actions
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Trophy className="w-5 h-5 text-orange-500" />;
      default:
        return <Award className="w-5 h-5 text-gray-300" />;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 1:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-50';
    if (change < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatValue = (performer: TopPerformer) => {
    if (performer.metric.includes('Time')) {
      return `${performer.value} days`;
    }
    if (performer.metric.includes('Rate')) {
      return `${performer.value}%`;
    }
    return performer.value.toString();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            {title}
          </h3>
          <p className="text-sm text-gray-500">{period}</p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={() => handleMenuAction('view-all')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Award className="w-4 h-4" />
                    View All Performers
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Performers List */}
      <div className="space-y-4">
        {performers.map((performer, index) => (
          <div
            key={performer.id}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
          >
            {/* Rank */}
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(index)}`}>
                {index < 3 ? getRankIcon(index) : index + 1}
              </div>
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {performer.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-yellow-600 transition-colors duration-200">
                  {performer.name}
                </h4>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeColor(performer.change)}`}>
                  {performer.change > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : performer.change < 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : null}
                  <span>{Math.abs(performer.change)}%</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mb-1">{performer.metric}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {formatValue(performer)}
                </span>
                
                {index === 0 && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                    <Crown className="w-3 h-3" />
                    <span>Top Performer</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Team Average</p>
            <p className="text-lg font-semibold text-blue-700">
              {Math.round(performers.reduce((sum, p) => sum + p.value, 0) / performers.length)}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 mb-1">Improvement</p>
            <p className="text-lg font-semibold text-green-700">
              +{Math.round(performers.reduce((sum, p) => sum + Math.abs(p.change), 0) / performers.length)}%
            </p>
          </div>
        </div>
      </div>

      {/* Recognition */}
      <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100">
        <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Recognition
        </h4>
        <p className="text-xs text-yellow-700">
          🎉 <strong>{performers[0].name}</strong> is leading the team with exceptional performance in {performers[0].metric.toLowerCase()}!
        </p>
      </div>
    </div>
  );
}
