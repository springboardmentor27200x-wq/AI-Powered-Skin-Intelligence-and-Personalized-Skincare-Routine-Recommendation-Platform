import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Edit3, AlertCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

export function SkinSummaryCard({ skinProfile }) {
  if (!skinProfile) {
    return (
      <Card
        title="Skin Profile"
        subtitle="Skin type & primary concerns"
        icon={Sparkles}
        action={
          <Link
            to="/skin-profile"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
          >
            Create <Edit3 className="w-3 h-3" />
          </Link>
        }
      >
        <div className="py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">No skin profile recorded yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Set your skin type, age bracket, and concerns</p>
          <Link
            to="/skin-profile"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
          >
            Complete Skin Profile
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Skin Profile"
      subtitle="Base skin characteristics"
      icon={Sparkles}
      action={
        <Link
          to="/skin-profile"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
        >
          Edit <Edit3 className="w-3 h-3" />
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Skin Type</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{skinProfile.skin_type}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Age Group</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{skinProfile.age_group}</div>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-700 block mb-2">Primary Concerns</span>
          {skinProfile.skin_concerns && skinProfile.skin_concerns.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {skinProfile.skin_concerns.map((concern) => (
                <Badge key={concern} variant="primary" size="sm">
                  {concern}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">None specified</span>
          )}
        </div>

        {(skinProfile.allergies || skinProfile.sensitivities) && (
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
            {skinProfile.allergies && (
              <div>
                <span className="font-semibold text-slate-700">Allergies: </span>
                <span className="text-slate-600">{skinProfile.allergies}</span>
              </div>
            )}
            {skinProfile.sensitivities && (
              <div>
                <span className="font-semibold text-slate-700">Sensitivities: </span>
                <span className="text-slate-600">{skinProfile.sensitivities}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
