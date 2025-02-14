import fs from 'fs';
import crypto from 'crypto';

export class Checkem {
    constructor() {
        this.data = {}; // Start with an empty dataset
    }

    /**
     * Load data from a file (optional)
     */
    load(path) {
        if (!path) throw new Error("No file path provided for loading.");

        try {
            if (!fs.existsSync(path)) {
                console.warn(`⚠️ No existing data found at ${path}.`);
                return;
            }

            const fileData = fs.readFileSync(path, 'utf8');
            const parsedData = JSON.parse(fileData);

            // Convert date strings back to Date objects
            for (const key in parsedData) {
                parsedData[key].updatedAt = parsedData[key].updatedAt ? new Date(parsedData[key].updatedAt) : null;
                parsedData[key].lastChecked = parsedData[key].lastChecked ? new Date(parsedData[key].lastChecked) : null;
            }

            this.data = parsedData;
        } catch (error) {
            throw new Error(`Failed to load data from ${path}: ${error.message}`);
        }
    }

    /**
     * Save data to a file (optional)
     */
    save(path) {
        if (!path) throw new Error("No file path provided for saving.");

        try {
            const serializableData = {};

            for (const key in this.data) {
                serializableData[key] = {
                    ...this.data[key],
                    updatedAt: this.data[key].updatedAt ? this.data[key].updatedAt.toISOString() : null,
                    lastChecked: this.data[key].lastChecked ? this.data[key].lastChecked.toISOString() : null
                };
            }

            fs.writeFileSync(path, JSON.stringify(serializableData, null, 2), 'utf8');
        } catch (error) {
            throw new Error(`Failed to save data to ${path}: ${error.message}`);
        }
    }

    /**
     * Generate a SHA-256 hash of the content
     */
    hashContent(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Check if a value has changed and update tracking data
     */
    check(key, value) {
        if (!key || value === undefined) {
            throw new Error("Both 'key' and 'value' are required.");
        }

        const record = this.data[key] || { timesChecked: 0, timesUpdated: 0 };
        const hasChanged = record.value !== value;

        this.data[key] = {
            value,  // Store raw value
            updatedAt: hasChanged ? new Date() : record.updatedAt,
            lastChecked: new Date(),
            timesChecked: (record.timesChecked || 0) + 1,
            timesUpdated: hasChanged ? (record.timesUpdated || 0) + 1 : (record.timesUpdated || 0)
        };

        return hasChanged;
    }

    /**
     * Check if a file's content (or any string-based content) has changed using a checksum
     */
    checkChecksum(key, content) {
        return this.check(key, this.hashContent(content));
    }

    /**
     * Get the last update timestamp for a key
     */
    getLastUpdate(key) {
        if (!this.data[key]) {
            throw new Error(`No record found for key: ${key}`);
        }
        return this.data[key].updatedAt || null;
    }
}
