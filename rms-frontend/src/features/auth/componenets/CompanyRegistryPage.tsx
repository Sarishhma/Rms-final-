import { useRegisterCompany } from "@/features/auth/hook/company-register.hook";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Building2,
  Phone,
  MapPin,
  Receipt,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { companySchema, type CompanyFormValues } from "@/zod/table.schema";

// ─── Schema ────────────────────────────────────────────────────────────────────

// ─── FieldGroup layout helper ──────────────────────────────────────────────────

function FieldGroup({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center gap-2 text-foreground font-medium text-sm">
          <Icon className="w-4 h-4 text-orange-500" />
          {title}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CompanyRegistryPage() {
  const registerCompany = useRegisterCompany();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      slug: "",
      businessName: "",
      phoneNumber: "",
      businessAddress: "",
      taxRegistrationNumber: "",
      currency: "NPR",
    },
    mode: "onTouched", // validate on blur, re-validate on change after first touch
  });

  // Auto-generate slug from company name
  const handleNameChange = (value: string, onChange: (v: string) => void) => {
    onChange(value);
    const isSlugPristine = !form.formState.dirtyFields.slug;
    if (isSlugPristine) {
      form.setValue(
        "slug",
        value
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        { shouldValidate: form.formState.touchedFields.slug },
      );
    }
  };

  const onSubmit = (values: CompanyFormValues) => {
    registerCompany.mutate({ ...values, maxUsers: 5 });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Set up your company
          </h1>

          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Add your business details to generate invoices and manage your
            workspace.
          </p>
        </div>

        {/* Card */}
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="p-6 md:p-8 space-y-8">
                {/* ── Company Identity ── */}
                <FieldGroup
                  icon={Building2}
                  title="Company identity"
                  description="How your company is identified across the platform."
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Company name{" "}
                            <span className="text-orange-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acme Corp"
                              {...field}
                              onChange={(e) =>
                                handleNameChange(e.target.value, field.onChange)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Slug <span className="text-orange-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs select-none pointer-events-none">
                                app/
                              </span>
                              <Input
                                placeholder="acme-corp"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FieldGroup>

                <Separator />

                {/* ── Contact ── */}
                <FieldGroup
                  icon={Phone}
                  title="Contact"
                  description="Primary contact details for this company."
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Legal business name{" "}
                            <span className="text-orange-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acme Private Limited"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+977 98XXXXXXXX"
                              type="tel"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FieldGroup>

                <Separator />

                {/* ── Address ── */}
                <FieldGroup
                  icon={MapPin}
                  title="Address"
                  description="Shown on invoices and official documents."
                >
                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Kathmandu, Bagmati, Nepal"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FieldGroup>

                <Separator />

                {/* ── Billing ── */}
                <FieldGroup
                  icon={Receipt}
                  title="Billing"
                  description="Tax and currency settings for invoicing."
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxRegistrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN / VAT number</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789" {...field} />
                          </FormControl>
                          <FormDescription>
                            9-digit PAN or 11-digit VAT number.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Currency <span className="text-orange-500">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="NPR">
                                🇳🇵 NPR — Nepalese Rupee
                              </SelectItem>
                              <SelectItem value="INR">
                                🇮🇳 INR — Indian Rupee
                              </SelectItem>
                              <SelectItem value="USD">
                                🇺🇸 USD — US Dollar
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FieldGroup>

                <Separator />

                {/* Submit */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 text-center sm:text-left">
                    You can update these details anytime later.
                  </p>

                  <Button
                    type="submit"
                    disabled={registerCompany.isPending}
                    className="w-full sm:w-auto px-8 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                  >
                    {registerCompany.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Create company
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
