
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

interface DebugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestData?: any;
  responseData?: any;
}

export function DebugDialog({ open, onOpenChange, requestData, responseData }: DebugDialogProps) {
  const { language, t } = useLanguage();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] md:max-w-4xl max-h-[90vh]" 
        dir={language === 'he' ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold">
            AWS Lambda Debug Data
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>
          
          <TabsContent value="request">
            <div className="p-4 border rounded-md bg-slate-50">
              <h3 className="text-md font-medium mb-2">Request Data</h3>
              <ScrollArea className="h-[50vh] rounded-md border p-4 bg-black">
                <pre className="text-xs md:text-sm text-green-400 font-mono">
                  {requestData ? JSON.stringify(requestData, null, 2) : 'No request data available'}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="response">
            <div className="p-4 border rounded-md bg-slate-50">
              <h3 className="text-md font-medium mb-2">Response Data</h3>
              <ScrollArea className="h-[50vh] rounded-md border p-4 bg-black">
                <pre className="text-xs md:text-sm text-green-400 font-mono">
                  {responseData ? JSON.stringify(responseData, null, 2) : 'No response data available'}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
