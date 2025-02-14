import fs from 'fs';
import crypto from 'crypto';

export class Checkem {
    constructor({ file = './checkem.json' } = {}) {
        this.file = file;
        this.data = this.load(); // Auto-load on creation
    }

    /**
     * Load data from the specified file (or create a new one if missing).
     */
    load() {
        try {
            if (!fs.existsSync(this.file)) {
                fs.writeFileSync(this.file, JSON.stringify({}, null, 2), 'utf8'); // Create empty file
                return {};
            }

            const fileData = fs.readFileSync(this.file, 'utf8');
            const parsedData = JSON.parse(fileData);

            // Convert stored date strings back to Date objects
            for (const key in parsedData) {
                parsedData[key].updatedAt = parsedData[key].updatedAt ? new Date(parsedData[key].updatedAt) : new Date();
                parsedData[key].lastChecked = parsedData[key].lastChecked ? new Date(parsedData[key].lastChecked) : new Date();
            }

            return parsedData;
        } catch (error) {
            throw new Error(`Failed to load data from ${this.file}: ${error.message}`);
        }
    }

    /**
     * Save data to the file.
     */
    save() {
        try {
            const serializableData = {};

            for (const key in this.data) {
                serializableData[key] = {
                    ...this.data[key],
                    updatedAt: this.data[key].updatedAt.toISOString(),
                    lastChecked: this.data[key].lastChecked.toISOString()
                };
            }

            fs.writeFileSync(this.file, JSON.stringify(serializableData, null, 2), 'utf8');
        } catch (error) {
            throw new Error(`Failed to save data to ${this.file}: ${error.message}`);
        }
    }

    /**
     * Generate a SHA-256 hash of the content.
     */
    hashContent(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Check if a value has changed and update tracking data.
     */
    check(key, value) {
        if (!key || value === undefined) {
            throw new Error("Both 'key' and 'value' are required.");
        }

        const record = this.data[key] || { timesChecked: 0, timesUpdated: 0, updatedAt: new Date() };
        const hasChanged = record.value !== value;

        this.data[key] = {
            value,  // Store raw value
            updatedAt: hasChanged ? new Date() : record.updatedAt,
            lastChecked: new Date(),
            timesChecked: (record.timesChecked || 0) + 1,
            timesUpdated: hasChanged ? (record.timesUpdated || 0) + 1 : (record.timesUpdated || 0)
        };

        this.save(); // Auto-save after changes

        return hasChanged;
    }

    /**
     * Check if a file's content (or any string-based content) has changed using a checksum.
     */
    checkChecksum(key, content) {
        return this.check(key, this.hashContent(content));
    }

    /**
     * Get the last update timestamp for a key.
     */
    getLastUpdate(key) {
        if (!this.data[key]) {
            throw new Error(`No record found for key: ${key}`);
        }
        return this.data[key].updatedAt;
    }
}
