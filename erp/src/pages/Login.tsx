import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, ArrowLeft, UserCircle, Shield, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { auth } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [step, setStep] = useState<"role" | "phone" | "otp">("role");
  const [role, setRole] = useState<"beneficiary" | "admin">("admin");
  const [phoneNumber, setPhoneNumber] = useState("9876543210");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [developmentOTP, setDevelopmentOTP] = useState<string | null>(null);

  // Get the return URL from location state
  const from = location.state?.from?.pathname || "/dashboard";

  const handleRoleSelect = () => {
    setStep("phone");
  };

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await auth.requestOTP(phoneNumber, 'login');
      
      // Store static OTP if provided
      if (response.data?.staticOTP || response.data?.developmentOTP) {
        const staticOTP = response.data?.staticOTP || response.data?.developmentOTP;
        setDevelopmentOTP(staticOTP);
        setOtp(staticOTP); // Auto-fill for convenience
      }
      
      toast({
        title: "OTP Sent",
        description: `Verification code sent to +91 ${phoneNumber}`,
      });
      setStep("otp");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      // Use the AuthContext login method
      await login(phoneNumber, otp);
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      // Navigate to the intended page or dashboard
      if (role === "beneficiary") {
        navigate("/beneficiary/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await auth.requestOTP(phoneNumber, 'login');
      
      // Store static OTP if provided
      if (response.data?.staticOTP || response.data?.developmentOTP) {
        const staticOTP = response.data?.staticOTP || response.data?.developmentOTP;
        setDevelopmentOTP(staticOTP);
        setOtp(staticOTP); // Auto-fill for convenience
      }
      
      toast({
        title: "OTP Resent",
        description: `New verification code sent to +91 ${phoneNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {step === "role" ? "Select Login Type" : step === "phone" ? "Login" : "Verify OTP"}
            </CardTitle>
            {step !== "role" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step === "otp" ? "phone" : "role")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <CardDescription>
            {step === "role" 
              ? "Choose how you want to access the system"
              : step === "phone" 
                ? `Logging in as ${role === "admin" ? "Admin" : "Beneficiary"}`
                : `We've sent a verification code to +91 ${phoneNumber}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "role" ? (
            <>
              <RadioGroup value={role} onValueChange={(v) => setRole(v as "beneficiary" | "admin")}>
                <div className="space-y-3">
                  <div 
                    className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                      role === "beneficiary" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setRole("beneficiary")}
                  >
                    <RadioGroupItem value="beneficiary" id="beneficiary" />
                    <Label htmlFor="beneficiary" className="flex items-center gap-3 cursor-pointer flex-1">
                      <UserCircle className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">Beneficiary Login</p>
                        <p className="text-sm text-muted-foreground">Apply for schemes and track applications</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                      role === "admin" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setRole("admin")}
                  >
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Shield className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">Admin Login</p>
                        <p className="text-sm text-muted-foreground">Manage applications and system</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
              
              <Button 
                className="w-full bg-gradient-primary shadow-glow" 
                onClick={handleRoleSelect}
              >
                Continue
              </Button>
            </>
          ) : step === "phone" ? (
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
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="mr-2 h-4 w-4" />
                )}
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                {developmentOTP && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
                    <p className="text-sm text-green-800 font-medium">
                      Static OTP: <span className="font-mono text-lg">{developmentOTP}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      This OTP is always 123456 for all logins
                    </p>
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
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
