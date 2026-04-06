'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  duration: z.coerce.number().min(5).max(480),
  color: z.string(),
  location: z.string().optional(),
  buffer_before: z.coerce.number().min(0).max(60),
  buffer_after: z.coerce.number().min(0).max(60),
});

const COLORS = ['#6366F1','#EC4899','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#14B8A6'];
const DURATIONS = [15,20,30,45,60,90,120].map(d => ({ value: String(d), label: `${d} minutes` }));

export default function NewEventTypePage() {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { duration: '30', color: '#6366F1', buffer_before: '0', buffer_after: '0' },
  });

  const addQuestion = () => setQuestions(prev => [...prev, { label: '', required: false }]);
  const removeQuestion = (i) => setQuestions(prev => prev.filter((_, idx) => idx !== i));
  const updateQuestion = (i, field, value) =>
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await fetch('/api/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, color: selectedColor, questions }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Event type created!');
      router.push('/event-types');
    } catch (e) {
      toast.error(e.message || 'Failed to create event type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/event-types" className="p-2 rounded-xl hover:bg-[#1A1A2E] text-[#8888AA] hover:text-[#F0F0FF] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-['Syne']">New Event Type</h1>
          <p className="text-[#8888AA] text-sm">Define what people can book with you</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold font-['Syne']">Basic Info</h2>
          <Input label="Event Name *" placeholder="e.g. 30 Minute Coffee Chat" error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" placeholder="What will we talk about?" rows={3} {...register('description')} />

          <div>
            <label className="block text-sm font-medium text-[#8888AA] mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1A1A2E] scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold font-['Syne']">Scheduling</h2>
          <Select
            label="Duration *"
            options={DURATIONS}
            error={errors.duration?.message}
            {...register('duration')}
          />
          <Input
            label="Location / Meeting Link"
            placeholder="Zoom link, Google Meet URL, phone number, or address"
            {...register('location')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Buffer Before (min)" type="number" min="0" max="60" {...register('buffer_before')} />
            <Input label="Buffer After (min)" type="number" min="0" max="60" {...register('buffer_after')} />
          </div>
        </div>

        {/* Custom Questions */}
        <div className="bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold font-['Syne']">Custom Questions</h2>
            <button type="button" onClick={addQuestion} className="text-xs text-[#6366F1] hover:text-[#EC4899] flex items-center gap-1 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add question
            </button>
          </div>
          {questions.length === 0 && (
            <p className="text-sm text-[#8888AA]">No custom questions. Guests will only fill in their name and email.</p>
          )}
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                className="flex-1 bg-[#0F0F1A] border border-[#2E2E50] rounded-xl px-4 py-2.5 text-sm text-[#F0F0FF] placeholder-[#8888AA] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
                placeholder={`Question ${i + 1}`}
                value={q.label}
                onChange={e => updateQuestion(i, 'label', e.target.value)}
              />
              <label className="flex items-center gap-1.5 text-xs text-[#8888AA] whitespace-nowrap cursor-pointer">
                <input type="checkbox" checked={q.required} onChange={e => updateQuestion(i, 'required', e.target.checked)} className="accent-[#6366F1]" />
                Required
              </label>
              <button type="button" onClick={() => removeQuestion(i)} className="text-[#EF4444] hover:text-[#EF4444]/80 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/event-types"><Button variant="secondary">Cancel</Button></Link>
          <Button type="submit" loading={loading}>Create Event Type</Button>
        </div>
      </form>
    </div>
  );
}
