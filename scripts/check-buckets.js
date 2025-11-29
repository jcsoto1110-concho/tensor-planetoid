
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        envVars[key] = value;
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (envVars.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('🔑 Using Service Role Key for admin privileges.');
} else {
    console.log('⚠️ Using Anon Key. Bucket creation might fail if RLS is enabled.');
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
    console.log('Checking storage buckets...');
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    console.log('Buckets found:', data);

    const bucketName = 'employee-documents';
    const bucket = data.find(b => b.name === bucketName);

    if (bucket) {
        console.log(`✅ Bucket '${bucketName}' exists.`);
    } else {
        console.error(`❌ Bucket '${bucketName}' does NOT exist.`);
        console.log('Attempting to create bucket...');

        const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf']
        });

        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log(`✅ Bucket '${bucketName}' created successfully.`);
        }
    }
}

checkBuckets();
