import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sendOtp, submitComment } from "@/services/api";
import { OTP_ENABLED } from "@/config/constants";

export const CommentModal = ({ isOpen, onClose, onSuccess, comment, uploadedFile, documentId, section }) => {
  const [step, setStep] = useState('confirm');
  const [userType, setUserType] = useState('individual');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    govIdType: '',
    govIdNumber: ''
  });
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Indian mobile numbers: 10 digits starting with 6-9
    const cleanPhone = phone.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleanPhone);
  };

  const validateGovernmentId = (idType, idNumber) => {
    if (!idType || !idNumber) return false;
    
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    
    switch (idType) {
      case 'aadhar':
        // Aadhar: 12 digits
        return /^\d{12}$/.test(cleanId);
      case 'pan':
        // PAN: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanId);
      default:
        return false;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    // No organization-specific validation required; user selects their entity type

    // Validate Government ID
    if (!formData.govIdType) {
      newErrors.govIdType = 'Please select a Government ID type';
    }
    
    if (!formData.govIdNumber.trim()) {
      newErrors.govIdNumber = 'Government ID number is required';
    } else if (!validateGovernmentId(formData.govIdType, formData.govIdNumber)) {
      newErrors.govIdNumber = 'Please enter a valid Government ID number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    setStep('details');
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form before proceeding.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      const { ok, data } = await sendOtp(formData.phone);

      if (!ok) {
        toast({
          title: "Could not send OTP",
          description: data.message || "Please try again later.",
          variant: "destructive"
        });
        return;
      }

      setOtp('');
      setStep('otp');
      setResendIn(60);
      toast({
        title: "OTP Sent",
        description: `An OTP has been sent to +91 ******${formData.phone.slice(-4)}`
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Could not send OTP",
        description: "Network error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!/^\d{6}$/.test(otp)) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP.",
        variant: "destructive"
      });
      return;
    }
    await submitFeedback();
  };

  // OTP disabled: details form validate karke seedha submit
  const handleDirectSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form before proceeding.",
        variant: "destructive"
      });
      return;
    }
    await submitFeedback();
  };

  const submitFeedback = async () => {
    setIsSubmitting(true);
    try {
      // Prepare data to send to backend
      const submitData = {
        documentId: documentId || 1,
        section: section || null,
        commentData: comment || '',
        commenterName: formData.fullName.trim(),
        commenterEmail: formData.email.trim(),
        commenterPhone: formData.phone,
        commenterAddress: formData.address || null,
        idType: formData.govIdType,
        idNumber: formData.govIdNumber,
        stakeholderType: userType,
        supportedDocFilename: uploadedFile ? uploadedFile.name : null,
        ...(OTP_ENABLED && { otp })
      };

      const { ok, data } = await submitComment(submitData);

      if (ok) {
        // Build sentiment display message
        let sentimentMessage = "Your comments have been submitted successfully.";
        if (data.sentiment) {
          const sentiment = data.sentiment.sentiment || 'neutral';
          const confidence = data.sentiment.confidence || 0;
          const confidencePercent = (confidence * 100).toFixed(0);
          sentimentMessage = `Your comments have been submitted successfully.\n\nSentiment: ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} (${confidencePercent}% confidence)`;
        }

        toast({
          title: "Success!",
          description: sentimentMessage,
          variant: "default"
        });
        onSuccess(data.sentiment);
        onClose();
        setStep('confirm');
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          address: '',
          govIdType: '',
          govIdNumber: ''
        });
        setOtp('');
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to submit comments.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Could not reach the server. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep('confirm');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      govIdType: '',
      govIdNumber: ''
    });
    setOtp('');
    setErrors({});
    setResendIn(0);
  };

  // Phone number formatting function
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    // Limit to 10 digits
    return phoneNumber.slice(0, 10);
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
    // Clear phone error when user starts typing
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  // Real-time email validation
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    
    // Real-time validation for email format
    if (email && !validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'confirm' && 'Confirm Submission'}
            {step === 'details' && 'User Details'}
            {step === 'otp' && 'OTP Verification'}
          </DialogTitle>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            <p>Are you sure you want to submit? Comments cannot be edited after submission.</p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleConfirm}>Confirm</Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, fullName: e.target.value }));
                  if (errors.fullName) {
                    setErrors(prev => ({ ...prev, fullName: '' }));
                  }
                }}
                placeholder="Enter your full name"
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="Enter your 10-digit phone number"
                maxLength={10}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
              {!errors.phone && formData.phone && (
                <p className={`text-xs mt-1 ${formData.phone.length === 10 ? 'text-green-600' : 'text-gray-500'}`}>
                  {formData.phone.length}/10 digits {formData.phone.length === 10 ? '✓' : ''}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your address"
              />
            </div>

            <div>
              <Label htmlFor="govIdType">Government ID Type *</Label>
              <Select
                value={formData.govIdType}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, govIdType: value, govIdNumber: '' }));
                  if (errors.govIdType) {
                    setErrors(prev => ({ ...prev, govIdType: '', govIdNumber: '' }));
                  }
                }}
              >
                <SelectTrigger className={errors.govIdType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select Government ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aadhar">Aadhar Card</SelectItem>
                  <SelectItem value="pan">PAN Card</SelectItem>
                </SelectContent>
              </Select>
              {errors.govIdType && (
                <p className="text-sm text-red-500 mt-1">{errors.govIdType}</p>
              )}
            </div>

            <div>
              <Label htmlFor="govIdNumber">Government ID Number *</Label>
              <Input
                id="govIdNumber"
                value={formData.govIdNumber}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setFormData(prev => ({ ...prev, govIdNumber: value }));
                  if (errors.govIdNumber) {
                    setErrors(prev => ({ ...prev, govIdNumber: '' }));
                  }
                  // Real-time validation
                  if (value && formData.govIdType && !validateGovernmentId(formData.govIdType, value)) {
                    setErrors(prev => ({ ...prev, govIdNumber: 'Please enter a valid Government ID number' }));
                  }
                }}
                placeholder={
                  formData.govIdType === 'aadhar' ? 'Enter 12-digit Aadhar number' :
                  formData.govIdType === 'pan' ? 'Enter PAN (e.g., ABCDE1234F)' :
                  'Enter Government ID number'
                }
                className={errors.govIdNumber ? 'border-red-500' : ''}
              />
              {errors.govIdNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.govIdNumber}</p>
              )}
              {formData.govIdType && formData.govIdNumber && !errors.govIdNumber && (
                <p className={`text-xs mt-1 ${validateGovernmentId(formData.govIdType, formData.govIdNumber) ? 'text-green-600' : 'text-gray-500'}`}>
                  {validateGovernmentId(formData.govIdType, formData.govIdNumber) ? '✓ Valid Government ID' : 
                    formData.govIdType === 'aadhar' ? 'Format: 12 digits (e.g., 123456789012)' :
                    formData.govIdType === 'pan' ? 'Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)' :
                    'Enter valid Government ID number'
                  }
                </p>
              )}
            </div>

            <div>
              <Label>Submitting as:</Label>
              <RadioGroup value={userType} onValueChange={setUserType} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ngo" id="ngo" />
                  <Label htmlFor="ngo">NGO</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="industry" id="industry" />
                  <Label htmlFor="industry">Industry Body</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="law" id="law" />
                  <Label htmlFor="law">Law Firm</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="consulting" id="consulting" />
                  <Label htmlFor="consulting">Consulting Firm</Label>
                </div>
              </RadioGroup>
            </div>

            {OTP_ENABLED ? (
              <Button onClick={handleSendOTP} className="w-full" disabled={isSendingOtp}>
                {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            ) : (
              <Button onClick={handleDirectSubmit} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              An OTP has been sent to +91 ******{formData.phone.slice(-4)}. It is valid for 10 minutes.
            </p>
            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                disabled={isSubmitting}
              />
            </div>
            <Button onClick={handleVerifySubmit} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Verify & Submit'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground underline disabled:no-underline disabled:opacity-60"
                onClick={() => setStep('details')}
                disabled={isSubmitting}
              >
                Change details
              </button>
              <button
                type="button"
                className="text-gov-blue underline disabled:no-underline disabled:opacity-60"
                onClick={handleSendOTP}
                disabled={isSubmitting || isSendingOtp || resendIn > 0}
              >
                {resendIn > 0 ? `Resend OTP in ${resendIn}s` : isSendingOtp ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};