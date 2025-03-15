
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DebugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestData?: any;
  responseData?: any;
}

export function DebugDialog({ open, onOpenChange, requestData, responseData }: DebugDialogProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<string>("request");
  const [copySuccess, setCopySuccess] = React.useState<boolean>(false);
  
  const isErrorResponse = responseData && responseData.error;

  const handleCopy = () => {
    const dataToCopy = activeTab === "request" 
      ? requestData 
      : responseData;
    
    if (!dataToCopy) {
      toast.error("No data available to copy");
      return;
    }
    
    const textToCopy = JSON.stringify(dataToCopy, null, 2);
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess(true);
        toast.success("Debug data copied to clipboard");
        
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      })
      .catch(err => {
        console.error("Failed to copy: ", err);
        toast.error("Failed to copy data to clipboard");
      });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] md:max-w-4xl max-h-[90vh]" 
        dir={language === 'he' ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            {isErrorResponse && <AlertCircle className="text-red-500" size={20} />}
            AWS Lambda Debug Data
            {isErrorResponse && <span className="text-red-500 text-sm font-normal">(Error Response)</span>}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs 
          defaultValue="request" 
          className="w-full"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="flex items-center justify-between mb-2">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              className="flex items-center gap-1"
            >
              {copySuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
          
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
              <h3 className="text-md font-medium mb-2">
                {isErrorResponse ? (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle size={16} />
                    Error Response
                  </span>
                ) : (
                  'Response Data'
                )}
              </h3>
              <ScrollArea className="h-[50vh] rounded-md border p-4 bg-black">
                <pre className={`text-xs md:text-sm ${isErrorResponse ? 'text-red-400' : 'text-green-400'} font-mono`}>
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
