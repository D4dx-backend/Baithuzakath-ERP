import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { beneficiaryApi } from "@/services/beneficiaryApi";

export default function BeneficiaryLogin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [developmentOTP, setDevelopmentOTP] = useState<string | null>(null);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await beneficiaryApi.sendOTP(phoneNumber);
      
      // Store development OTP if available
      if (response.developmentOTP) {
        setDevelopmentOTP(response.developmentOTP);
      }
      
      toast({
        title: "OTP Sent",
        description: `Verification code sent to +91 ${phoneNumber}`,
      });
      setStep("otp");
    } catch (error) {
      toast({
        title: "Failed to Send OTP",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await beneficiaryApi.verifyOTP(phoneNumber, otp);
      
      // Store user role for compatibility
      localStorage.setItem("user_role", "beneficiary");
      localStorage.setItem("user_phone", phoneNumber);
      
      toast({
        title: "Login Successful",
        description: `Welcome, ${response.user.name}!`,
      });
      
      setTimeout(() => {
        navigate("/beneficiary/dashboard");
      }, 1000);
    } catch (error) {
      toast({
        title: "Invalid OTP",
        description: error instanceof Error ? error.message : "Please check your OTP and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await beneficiaryApi.resendOTP(phoneNumber);
      
      // Store development OTP if available
      if (response.developmentOTP) {
        setDevelopmentOTP(response.developmentOTP);
      }
      
      toast({
        title: "OTP Resent",
        description: `New verification code sent to +91 ${phoneNumber}`,
      });
    } catch (error) {
      toast({
        title: "Failed to Resend OTP",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {step === "phone" ? "Beneficiary Login" : "Verify OTP"}
            </CardTitle>
            {step === "otp" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("phone")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Home
              </Button>
            )}
          </div>
          <CardDescription>
            {step === "phone" 
              ? "Enter your mobile number to apply for schemes"
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
                disabled={isLoading}
              >
                <Phone className="mr-2 h-4 w-4" />
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                
                {/* Development OTP Display */}
                {developmentOTP && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-800">Development Mode</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your OTP is: <span className="font-mono font-bold text-lg">{developmentOTP}</span>
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      This OTP is shown for testing purposes only
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => setOtp(developmentOTP)}
                    >
                      Auto-fill OTP
                    </Button>
                  </div>
                )}
                
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
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify & Login"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
