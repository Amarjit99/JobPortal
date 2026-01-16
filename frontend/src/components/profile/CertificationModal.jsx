import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const CertificationModal = ({ open, onClose, onSave, certification, mode }) => {
    const [formData, setFormData] = useState({
        name: '',
        issuingOrganization: '',
        issueDate: '',
        expirationDate: '',
        credentialID: '',
        credentialURL: ''
    });

    // Sync form data when certification prop changes (for edit mode)
    React.useEffect(() => {
        if (certification) {
            setFormData({
                name: certification.name || '',
                issuingOrganization: certification.issuingOrganization || '',
                issueDate: certification.issueDate ? new Date(certification.issueDate).toISOString().split('T')[0] : '',
                expirationDate: certification.expirationDate ? new Date(certification.expirationDate).toISOString().split('T')[0] : '',
                credentialID: certification.credentialID || '',
                credentialURL: certification.credentialURL || ''
            });
        } else {
            // Reset form for add mode
            setFormData({
                name: '',
                issuingOrganization: '',
                issueDate: '',
                expirationDate: '',
                credentialID: '',
                credentialURL: ''
            });
        }
    }, [certification, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        // Reset form
        setFormData({
            name: '',
            issuingOrganization: '',
            issueDate: '',
            expirationDate: '',
            credentialID: '',
            credentialURL: ''
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'edit' ? 'Edit Certification' : 'Add Certification'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Certification Name *</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. AWS Certified Solutions Architect"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="issuingOrganization">Issuing Organization *</Label>
                        <Input
                            id="issuingOrganization"
                            name="issuingOrganization"
                            value={formData.issuingOrganization}
                            onChange={handleChange}
                            placeholder="e.g. Amazon Web Services"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="issueDate">Issue Date</Label>
                            <Input
                                id="issueDate"
                                name="issueDate"
                                type="date"
                                value={formData.issueDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <Label htmlFor="expirationDate">Expiration Date</Label>
                            <Input
                                id="expirationDate"
                                name="expirationDate"
                                type="date"
                                value={formData.expirationDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="credentialID">Credential ID</Label>
                        <Input
                            id="credentialID"
                            name="credentialID"
                            value={formData.credentialID}
                            onChange={handleChange}
                            placeholder="e.g. ABC123XYZ"
                        />
                    </div>

                    <div>
                        <Label htmlFor="credentialURL">Credential URL</Label>
                        <Input
                            id="credentialURL"
                            name="credentialURL"
                            type="url"
                            value={formData.credentialURL}
                            onChange={handleChange}
                            placeholder="https://www.example.com/verify/credential"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {mode === 'edit' ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CertificationModal;
