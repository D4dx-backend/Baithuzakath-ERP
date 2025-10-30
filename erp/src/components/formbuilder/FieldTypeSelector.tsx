import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FieldType {
  type: string;
  label: string;
  icon: string;
  category: "basic" | "advanced" | "layout";
}

const fieldTypes: FieldType[] = [
  { type: "text", label: "Text Input", icon: "📝", category: "basic" },
  { type: "textarea", label: "Text Area", icon: "📄", category: "basic" },
  { type: "number", label: "Number", icon: "🔢", category: "basic" },
  { type: "email", label: "Email", icon: "📧", category: "basic" },
  { type: "phone", label: "Phone", icon: "📱", category: "basic" },
  { type: "date", label: "Date", icon: "📅", category: "basic" },
  { type: "yesno", label: "Yes/No", icon: "✓✗", category: "basic" },
  { type: "dropdown", label: "Dropdown", icon: "▼", category: "basic" },
  { type: "multiselect", label: "Multi Select", icon: "☑", category: "basic" },
  { type: "radio", label: "Radio Buttons", icon: "◉", category: "basic" },
  { type: "checkbox", label: "Checkboxes", icon: "☐", category: "basic" },
  { type: "file", label: "File Upload", icon: "📎", category: "basic" },
  { type: "title", label: "Title/Heading", icon: "H", category: "layout" },
  { type: "html", label: "HTML Editor", icon: "✏️", category: "advanced" },
  { type: "group", label: "Field Group", icon: "📦", category: "layout" },
  { type: "page", label: "Page Break", icon: "📃", category: "layout" },
  { type: "row", label: "Row Container", icon: "⬌", category: "layout" },
  { type: "column", label: "Column Layout", icon: "⬍", category: "layout" },
];

interface FieldTypeSelectorProps {
  onSelectFieldType: (type: string) => void;
}

export function FieldTypeSelector({ onSelectFieldType }: FieldTypeSelectorProps) {
  const handleDragStart = (e: React.DragEvent, fieldType: string) => {
    e.dataTransfer.setData('fieldType', fieldType);
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Add Field</h3>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">BASIC FIELDS</p>
          <div className="grid grid-cols-2 gap-2">
            {fieldTypes.filter(f => f.category === "basic").map((field) => (
              <Button
                key={field.type}
                variant="outline"
                size="sm"
                className="justify-start cursor-move"
                onClick={() => onSelectFieldType(field.type)}
                draggable
                onDragStart={(e) => handleDragStart(e, field.type)}
              >
                <span className="mr-2">{field.icon}</span>
                <span className="text-xs">{field.label}</span>
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">LAYOUT</p>
          <div className="grid grid-cols-2 gap-2">
            {fieldTypes.filter(f => f.category === "layout").map((field) => (
              <Button
                key={field.type}
                variant="outline"
                size="sm"
                className="justify-start cursor-move"
                onClick={() => onSelectFieldType(field.type)}
                draggable
                onDragStart={(e) => handleDragStart(e, field.type)}
              >
                <span className="mr-2">{field.icon}</span>
                <span className="text-xs">{field.label}</span>
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">ADVANCED</p>
          <div className="grid grid-cols-2 gap-2">
            {fieldTypes.filter(f => f.category === "advanced").map((field) => (
              <Button
                key={field.type}
                variant="outline"
                size="sm"
                className="justify-start cursor-move"
                onClick={() => onSelectFieldType(field.type)}
                draggable
                onDragStart={(e) => handleDragStart(e, field.type)}
              >
                <span className="mr-2">{field.icon}</span>
                <span className="text-xs">{field.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
