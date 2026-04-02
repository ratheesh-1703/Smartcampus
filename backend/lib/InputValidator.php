<?php
/**
 * INPUT VALIDATION & SANITIZATION HELPER
 */

class InputValidator {
    /**
     * Validate and sanitize string input
     */
    public static function string($value, $minLen = 1, $maxLen = 255) {
        if(!isset($value)) return null;
        
        $value = trim((string)$value);
        
        if(strlen($value) < $minLen) {
            throw new Exception("Input too short (min: $minLen)");
        }
        if(strlen($value) > $maxLen) {
            throw new Exception("Input too long (max: $maxLen)");
        }
        
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validate integer input
     */
    public static function integer($value, $min = null, $max = null) {
        if(!isset($value)) return null;
        
        if(!is_numeric($value)) {
            throw new Exception("Invalid integer value");
        }
        
        $value = intval($value);
        
        if($min !== null && $value < $min) {
            throw new Exception("Value below minimum ($min)");
        }
        if($max !== null && $value > $max) {
            throw new Exception("Value above maximum ($max)");
        }
        
        return $value;
    }
    
    /**
     * Validate email
     */
    public static function email($value) {
        if(!isset($value)) return null;
        
        $value = trim((string)$value);
        
        if(!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Invalid email format");
        }
        
        return strtolower($value);
    }
    
    /**
     * Validate phone
     */
    public static function phone($value) {
        if(!isset($value)) return null;
        
        $value = preg_replace('/[^0-9+\-\s()]/', '', $value);
        
        if(strlen($value) < 7) {
            throw new Exception("Invalid phone number");
        }
        
        return $value;
    }
    
    /**
     * Validate date
     */
    public static function date($value) {
        if(!isset($value)) return null;
        
        $value = trim((string)$value);
        
        if(!strtotime($value)) {
            throw new Exception("Invalid date format");
        }
        
        return date('Y-m-d', strtotime($value));
    }
    
    /**
     * Validate image file
     */
    public static function imageFile($file, $maxSizeKB = 5000) {
        if(!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("File upload error");
        }
        
        $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $mime = mime_content_type($file['tmp_name']);
        
        if(!in_array($mime, $allowed)) {
            throw new Exception("Invalid file type. Only JPG, PNG, GIF, WebP allowed");
        }
        
        $size = $file['size'] / 1024; // KB
        if($size > $maxSizeKB) {
            throw new Exception("File too large (max: {$maxSizeKB}KB)");
        }
        
        return true;
    }
    
    /**
     * Validate enum/choice
     */
    public static function enum($value, $choices) {
        if(!isset($value)) return null;
        
        $value = (string)$value;
        
        if(!in_array($value, $choices, true)) {
            throw new Exception("Invalid choice");
        }
        
        return $value;
    }
    
    /**
     * Required field check
     */
    public static function required($value, $fieldName = "Field") {
        if(empty($value)) {
            throw new Exception("$fieldName is required");
        }
        return $value;
    }
    
    /**
     * Sanitize HTML (strip tags but keep structure)
     */
    public static function html($value) {
        if(!isset($value)) return null;
        
        return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
    }
}

?>
