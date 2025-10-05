// src/pages/QuestsPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Star, CheckCircle, Clock, UploadCloud } from 'lucide-react';

// Define the structure for a Quest
interface Quest {
  id: string;
  title: string;
  description: string;
  points: number;
  link: string;
  instructions: string[];
}

// Define the structure for a user's submission
interface Submission {
  quest_type: string;
  status: 'pending' | 'approved' | 'rejected';
}

// For now, we will hardcode the available quests. Later, this could come from a database table.
const availableQuests: Quest[] = [
  {
    id: 'google_review',
    title: 'Review us on Google Maps',
    description: 'Leave an honest review about your experience on our Google Maps page.',
    points: 2,
    link: 'https://maps.google.com/?cid=11266092328424134394&g_mp=Cidnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLlNlYXJjaFRleHQ',
    instructions: [
      'Click the link to go to our Google Maps page.',
      'Write and publish your review.',
      'Take a screenshot of your published review.',
      'Upload the screenshot below as proof.'
    ]
  },
  // You can add more quests here in the future
];

const QuestsPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch the user's existing submissions to track their status
    const fetchSubmissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('quest_submissions')
          .select('quest_type, status')
          .eq('user_id', user.id);
        if (error) console.error("Error fetching submissions:", error);
        else setSubmissions(data as Submission[]);
      }
    };
    fetchSubmissions();
  }, []);

  const handleSubmitProof = async () => {
    if (!proofFile || !selectedQuest) return;

    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    try {
      // 1. Upload the screenshot to Supabase Storage
      const filePath = `public/${user.id}/${selectedQuest.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from('quest-proof')
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('quest-proof')
        .getPublicUrl(filePath);

      // 3. Insert the submission record into the database
      const { error: insertError } = await supabase
        .from('quest_submissions')
        .insert({
          user_id: user.id,
          quest_type: selectedQuest.id,
          proof_url: publicUrl,
          points_to_award: selectedQuest.points,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: 'Submission Received!',
        description: 'Your quest submission is now pending review. Points will be awarded upon approval.',
      });
      
      // Refresh submissions and close modal
      setSubmissions([...submissions, { quest_type: selectedQuest.id, status: 'pending' }]);
      setSelectedQuest(null);
      setProofFile(null);
    } catch (error: any) {
      console.error("Error submitting proof:", error);
      toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const getQuestStatus = (questId: string) => {
    const submission = submissions.find(s => s.quest_type === questId);
    return submission ? submission.status : 'available';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/account" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back to Account</Link>
          <h1 className="text-4xl font-bold text-amber-400 mt-2">Side Quests</h1>
          <p className="text-gray-400">Complete tasks to earn extra loyalty points!</p>
        </div>

        <div className="space-y-4">
          {availableQuests.map(quest => {
            const status = getQuestStatus(quest.id);
            const isDisabled = status === 'pending' || status === 'approved';

            return (
              <div key={quest.id} className={`p-6 rounded-lg flex items-center justify-between bg-gray-800 border border-gray-700 ${isDisabled ? 'opacity-60' : ''}`}>
                <div>
                  <h3 className="text-xl font-bold">{quest.title}</h3>
                  <p className="text-gray-400">{quest.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-amber-400 font-semibold">
                    <Star className="w-5 h-5" />
                    <span>Earn {quest.points} Points</span>
                  </div>
                </div>
                <div>
                  {status === 'available' && (
                    <Button onClick={() => setSelectedQuest(quest)} disabled={isDisabled}>Start Quest</Button>
                  )}
                  {status === 'pending' && (
                    <div className="flex items-center gap-2 text-yellow-400"><Clock className="w-5 h-5"/> In Review</div>
                  )}
                  {status === 'approved' && (
                    <div className="flex items-center gap-2 text-green-400"><CheckCircle className="w-5 h-5"/> Completed</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submission Modal */}
      <Dialog open={!!selectedQuest} onOpenChange={() => setSelectedQuest(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400 text-2xl">{selectedQuest?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">Follow the steps below to complete the quest and earn {selectedQuest?.points} points.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <h4 className="font-semibold">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              {selectedQuest?.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
            <a href={selectedQuest?.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              Click here to open the link &rarr;
            </a>
            <div className="space-y-2">
              <label htmlFor="proof" className="font-semibold">Upload Proof (Screenshot)</label>
              <Input id="proof" type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)} className="bg-gray-700 border-gray-600"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedQuest(null)}>Cancel</Button>
            <Button onClick={handleSubmitProof} disabled={!proofFile || isUploading}>
              {isUploading ? 'Submitting...' : <><UploadCloud className="w-4 h-4 mr-2"/> Submit for Review</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestsPage;