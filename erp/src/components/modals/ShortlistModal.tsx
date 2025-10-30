import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { interviews } from "@/lib/api";

interface ShortlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicantName: string;
  onSuccess?: () => void;
  mode?: "schedule" | "reschedule";
  existingInterview?: any;
}

export function ShortlistModal({ isOpen, onClose, applicationId, applicantName, onSuccess, mode = "schedule", existingInterview }: ShortlistModalProps) {
  const [interviewType, setInterviewType] = useState<"offline" | "online">("offline");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    hour: "09",
    minute: "00",
    period: "AM",
    location: "",
    link: "",
  });

  // Pre-populate form data when in reschedule mode
  useEffect(() => {
    if (mode === "reschedule" && existingInterview && isOpen) {
      const existingDate = existingInterview.scheduledDate ? 
        new Date(existingInterview.scheduledDate).toISOString().split('T')[0] : "";
      
      let hour = "09", minute = "00", period = "AM";
      if (existingInterview.scheduledTime) {
        const timeParts = existingInterview.scheduledTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeParts) {
          hour = timeParts[1].padStart(2, '0');
          minute = timeParts[2];
          period = timeParts[3].toUpperCase();
        }
      }

      setFormData({
        date: existingDate,
        hour,
        minute,
        period,
        location: existingInterview.location || "",
        link: existingInterview.meetingLink || "",
      });
      
      setInterviewType(existingInterview.type || "offline");
    } else if (mode === "schedule" && isOpen) {
      // Reset form for new scheduling
      setFormData({
        date: "",
        hour: "09",
        minute: "00",
        period: "AM",
        location: "",
        link: "",
      });
      setInterviewType("offline");
    }
  }, [mode, existingInterview, isOpen]);

  // Generate hours 01-12
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  // Generate minutes 00-55 in 5 minute intervals
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

  const handleSubmit = async () => {
    if (!formData.date) {
      toast({
        title: "Error",
        description: "Please select an interview date",
        variant: "destructive",
      });
      return;
    }

    if (interviewType === "offline" && !formData.location.trim()) {
      toast({
        title: "Error",
        description: "Please enter interview location",
        variant: "destructive",
      });
      return;
    }

    if (interviewType === "online" && !formData.link.trim()) {
      toast({
        title: "Error",
        description: "Please enter meeting link",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const timeString = `${formData.hour}:${formData.minute} ${formData.period}`;
      
      const interviewData = {
        date: formData.date,
        time: timeString,
        type: interviewType,
        location: interviewType === "offline" ? formData.location : undefined,
        meetingLink: interviewType === "online" ? formData.link : undefined,
      };

      const response = mode === "reschedule" ? 
        await interviews.update(applicationId, interviewData) :
        await interviews.schedule(applicationId, interviewData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: mode === "reschedule" ? 
            `Interview rescheduled successfully for ${applicantName}` :
            `Interview scheduled successfully for ${applicantName}`,
        });
        
        // Reset and close
        setFormData({ date: "", hour: "09", minute: "00", period: "AM", location: "", link: "" });
        setInterviewType("offline");
        onSuccess?.();
        onClose();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to schedule interview",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "reschedule" ? "Reschedule Interview" : "Schedule Interview"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Application: {applicationId}</p>
            <p className="text-sm font-medium">{applicantName}</p>
          </div>

          <div className="space-y-2">
            <Label>Interview Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className="pl-10"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interview Time</Label>
            <div className="flex gap-2 items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Select value={formData.hour} onValueChange={(value) => setFormData({ ...formData, hour: value })}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">:</span>
              <Select value={formData.minute} onValueChange={(value) => setFormData({ ...formData, minute: value })}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interview Type</Label>
            <RadioGroup value={interviewType} onValueChange={(value: "offline" | "online") => setInterviewType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offline" id="offline" />
                <Label htmlFor="offline" className="font-normal">Offline</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="font-normal">Online</Label>
              </div>
            </RadioGroup>
          </div>

          {interviewType === "offline" ? (
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter interview location"
                  className="pl-10"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://meet.google.com/..."
                  className="pl-10"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "reschedule" ? "Update Interview" : "Schedule Interview"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
