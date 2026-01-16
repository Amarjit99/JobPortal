import ReCAPTCHA from 'react-google-recaptcha';
import { useRef } from 'react';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key for development

const RecaptchaComponent = ({ onChange, onExpired, onError }) => {
    const recaptchaRef = useRef(null);

    const handleChange = (token) => {
        if (onChange) {
            onChange(token);
        }
    };

    const handleExpired = () => {
        if (onExpired) {
            onExpired();
        }
    };

    const handleError = () => {
        if (onError) {
            onError();
        }
    };

    // Check if reCAPTCHA is enabled
    const isEnabled = import.meta.env.VITE_RECAPTCHA_ENABLED !== 'false';

    if (!isEnabled) {
        return null; // Don't render if disabled
    }

    return (
        <div className="my-4 flex justify-center">
            <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleChange}
                onExpired={handleExpired}
                onErrored={handleError}
                theme="light"
                size="normal"
            />
        </div>
    );
};

export default RecaptchaComponent;
