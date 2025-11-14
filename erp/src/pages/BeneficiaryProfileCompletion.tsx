import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { beneficiaryApi } from "@/services/beneficiaryApi";
import logo from "@/assets/logo.png";

// Kerala Districts
const KERALA_DISTRICTS = [
  "Alappuzha",
  "Ernakulam",
  "Idukki",
  "Kannur",
  "Kasaragod",
  "Kollam",
  "Kottayam",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Thiruvananthapuram",
  "Thrissur",
  "Wayanad"
];

export default function BeneficiaryProfileCompletion() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    district: ""
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('beneficiary_token');
    const phone = localStorage.getItem('user_phone');
    
    if (!token) {
      navigate('/beneficiary-login', { replace: true });
    }
    
    if (phone) {
      setPhoneNumber(phone);
    }
  }, [navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.gender) {
      toast({
        title: "Gender Required",
        description: "Please select your gender",
        variant: "destructive",
      });
      return;
    }

    if (!formData.district) {
      toast({
        title: "District Required",
        description: "Please select your district",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const profileData = {
        name: formData.name.trim(),
        profile: {
          gender: formData.gender,
          address: {
            district: formData.district,
            state: "Kerala"
          }
        }
      };

      const response = await beneficiaryApi.updateProfile(profileData);
      
      // Update stored user data
      localStorage.setItem('beneficiary_user', JSON.stringify(response.user));
      
      toast({
        title: "Profile Completed",
        description: "Your profile has been set up successfully!",
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate("/beneficiary/dashboard", { replace: true });
      }, 1000);

    } catch (error) {
      console.error('Profile completion error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Logo" className="h-16 w-16 rounded-full" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide your details to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <User className="h-4 w-4" />
                Personal Information
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">This is your registered mobile number</p>
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer font-normal">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer font-normal">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="cursor-pointer font-normal">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => handleInputChange('district', value)}
                >
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select your district" />
                  </SelectTrigger>
                  <SelectContent>
                    {KERALA_DISTRICTS.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary shadow-glow"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                "Complete Profile & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
