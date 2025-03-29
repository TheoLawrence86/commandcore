# Frontend Ingestion UI (2025 Update)

## Definition

The Frontend Ingestion UI is a modern, accessible web interface built with React and TypeScript that allows non-technical users to upload documents and add metadata to populate the CommandCore knowledge bases.

## Role in CommandCore

The Ingestion UI serves as the entry point for knowledge base population:

- **Document Upload**: Provides an intuitive, accessible interface for uploading various document types
- **Metadata Collection**: Captures essential information about documents with real-time validation
- **User Feedback**: Communicates processing status and results with ARIA-live regions
- **Domain Selection**: Directs documents to the appropriate knowledge domain
- **Error Handling**: Provides clear, accessible feedback when issues occur during upload or processing

## Key Features Used (2025)

### Modern Component Architecture

The UI uses React with Shadcn/ui components for a robust, accessible interface:

```tsx
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Form validation schema
const uploadSchema = z.object({
  file: z.instanceof(File)
    .refine(f => f.size <= 10 * 1024 * 1024, "File must be 10MB or less")
    .refine(f => ["text/plain", "application/pdf"].includes(f.type), 
      "Only .txt and .pdf files are supported"),
  domain: z.enum(["ai", "cloud", "virt-os"]),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  publicationDate: z.date().optional(),
  url: z.string().url().optional(),
  additionalNotes: z.string().max(1000).optional()
})

type UploadFormData = z.infer<typeof uploadSchema>

export function UploadForm() {
  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema)
  })

  const onSubmit = async (data: UploadFormData) => {
    const formData = new FormData()
    formData.append("file", data.file)
    formData.append("domain", data.domain)
    formData.append("source_info", JSON.stringify({
      title: data.title,
      author: data.author,
      publication_date: data.publicationDate?.toISOString(),
      url: data.url,
      additional_notes: data.additionalNotes
    }))

    try {
      const response = await fetch("/upload/", {
        method: "POST",
        body: formData
      })
      // Handle response...
    } catch (error) {
      // Error handling...
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Document</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".txt,.pdf"
                  onChange={e => field.onChange(e.target.files?.[0])}
                  aria-describedby="file-constraints"
                />
              </FormControl>
              <FormDescription id="file-constraints">
                Supported formats: .txt, .pdf (max 10MB)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Knowledge Domain</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai">Artificial Intelligence</SelectItem>
                  <SelectItem value="cloud">Cloud Computing</SelectItem>
                  <SelectItem value="virt-os">Virtualisation & Operating Systems</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Other form fields... */}
        
        <Button 
          type="submit"
          disabled={form.formState.isSubmitting}
          aria-live="polite"
        >
          {form.formState.isSubmitting ? "Uploading..." : "Upload Document"}
        </Button>
      </form>
    </Form>
  )
}
```

### Modern Styling with Tailwind CSS

The UI uses Tailwind CSS for maintainable, responsive styling:

```css
/* tailwind.config.ts */
import { type Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other theme colours
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
```

## Accessibility Features (2025)

- **ARIA Live Regions**: Dynamic updates for screen readers
- **Keyboard Navigation**: Full keyboard support with visible focus states
- **Error Handling**: Clear error messages with aria-invalid states
- **Progressive Enhancement**: Works without JavaScript
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Dark Mode Support**: Automatic and manual dark mode switching
- **Reduced Motion**: Respects user motion preferences

## Performance Optimisation

- **Chunked Uploads**: Large files are split into chunks for reliable uploads
- **Client-side Validation**: Immediate feedback using Zod schemas
- **Image Optimisation**: Automatic WebP conversion for image previews
- **Bundle Size**: Tree-shaking and code splitting for minimal JS
- **Loading States**: Optimistic UI updates with proper loading indicators

## Official Documentation

- [React Documentation](https://react.dev)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)
