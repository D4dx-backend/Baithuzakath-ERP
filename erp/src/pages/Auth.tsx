import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const handleSendOTP = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    // Simulate OTP send
    toast({
      title: "OTP Sent",
      description: `Verification code sent to +91 ${phoneNumber}`,
    });
    setStep("otp");
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    // Simulate OTP verification
    toast({
      title: "Login Successful",
      description: "Welcome back!",
    });
    
    // Navigate to dashboard
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  const handleResendOTP = () => {
    toast({
      title: "OTP Resent",
      description: `New verification code sent to +91 ${phoneNumber}`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {step === "phone" ? "Login" : "Verify OTP"}
            </CardTitle>
            {step === "otp" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("phone")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <CardDescription>
            {step === "phone" 
              ? "Enter your mobile number to receive an OTP"
              : `We've sent a verification code to +91 ${phoneNumber}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "phone" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center border border-input rounded-md px-3 bg-muted text-sm font-medium">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-primary shadow-glow" 
                onClick={handleSendOTP}
              >
                <Phone className="mr-2 h-4 w-4" />
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold"
                    onClick={handleResendOTP}
                  >
                    Resend OTP
                  </Button>
                </p>
              </div>

              <Button 
                className="w-full bg-gradient-primary shadow-glow" 
                onClick={handleVerifyOTP}
              >
                Verify & Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
