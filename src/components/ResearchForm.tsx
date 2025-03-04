// components/ResearchForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from './Button';

const formSchema = z.object({
  segmentInfo: z.string().min(10, 'Please provide segment information (minimum 10 characters)'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResearchForm({ onSubmit }: { onSubmit: (values: FormValues) => Promise<void> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  
  const submitHandler = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      <div>
        <label htmlFor="segmentInfo" className="block text-[#f7f8f8] font-medium mb-2">
          Market Research Segment Information
        </label>
        <textarea
          id="segmentInfo"
          className="input-field text-base w-full min-h-[200px]"
          placeholder="Paste your market research segments information here..."
          {...register('segmentInfo')}
        />
        {errors.segmentInfo && (
          <p className="mt-2 text-red-400 text-sm">{errors.segmentInfo.message}</p>
        )}
      </div>
      
      <div className="pt-4">
        <Button 
          type="submit" 
          isLoading={isSubmitting} 
          size="lg" 
          className="w-full"
        >
          Generate Targeting Strategy
        </Button>
      </div>
    </form>
  );
}