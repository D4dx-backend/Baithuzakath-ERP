import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, IndianRupee, Users } from "lucide-react";
import logo from "@/assets/logo.png";

const mockSchemes = [
  {
    id: "1",
    name: "Education Support Scheme",
    description: "Financial assistance for students from economically weaker sections",
    amount: "₹10,000 - ₹50,000",
    deadline: "2025-12-31",
    beneficiaries: 150,
    status: "Open",
  },
  {
    id: "2",
    name: "Healthcare Assistance",
    description: "Medical support for critical health conditions and surgeries",
    amount: "₹25,000 - ₹1,00,000",
    deadline: "2025-11-30",
    beneficiaries: 89,
    status: "Open",
  },
  {
    id: "3",
    name: "Small Business Grant",
    description: "Startup capital for small entrepreneurs and self-employment",
    amount: "₹50,000 - ₹2,00,000",
    deadline: "2025-10-15",
    beneficiaries: 45,
    status: "Open",
  },
  {
    id: "4",
    name: "Housing Support",
    description: "Financial aid for housing construction and renovation",
    amount: "₹1,00,000 - ₹3,00,000",
    deadline: "2026-01-31",
    beneficiaries: 67,
    status: "Open",
  },
];

export default function PublicSchemes() {
  const navigate = useNavigate();

  const handleSchemeClick = (schemeId: string) => {
    // Check if user is logged in (mock check)
    const isLoggedIn = localStorage.getItem("user_role");
    
    if (!isLoggedIn) {
      // Navigate directly to beneficiary login
      navigate("/beneficiary-login");
    } else {
      navigate(`/beneficiary/apply/${schemeId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-12 w-12 rounded-full" />
            <div>
              <h1 className="text-lg font-bold">Baithuzzakath Kerala</h1>
              <p className="text-xs text-muted-foreground">Empowering Communities</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Available Schemes
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Browse and apply for various assistance programs designed to support our community
          </p>
        </div>
      </section>

      {/* Schemes Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockSchemes.map((scheme) => (
              <Card 
                key={scheme.id} 
                className="hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => handleSchemeClick(scheme.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{scheme.name}</CardTitle>
                    <Badge variant="default" className="bg-green-600">
                      {scheme.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {scheme.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{scheme.amount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {new Date(scheme.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{scheme.beneficiaries} Beneficiaries</span>
                  </div>
                  <Button className="w-full mt-4" variant="default">
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Baithuzzakath Kerala. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
