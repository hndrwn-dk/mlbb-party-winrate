# OpenAI API Key Setup Guide

This guide explains how to create an OpenAI API key and add it to your Vercel project.

## Part 1: Creating OpenAI API Key

### Step 1: Sign Up / Log In to OpenAI

1. **Go to OpenAI Platform**
   - Navigate to [platform.openai.com](https://platform.openai.com)
   - Sign up for a new account or log in if you already have one

2. **Verify Your Account**
   - Complete email verification if required
   - Add billing information (OpenAI charges per usage)

### Step 2: Create API Key

1. **Navigate to API Keys Section**
   - Once logged in, go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Or click on your profile → **API keys**

2. **Create New Secret Key**
   - Click **"+ Create new secret key"** button
   - Give it a name (e.g., `mlbb-party-winrate-prod`)
   - Click **"Create secret key"**

3. **Copy the API Key (IMPORTANT)**
   - **Copy the key immediately** - it will look like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **You won't be able to see this key again!** If you lose it, you'll need to create a new one
   - Store it securely (e.g., password manager, secure notes)

4. **Set Usage Limits (Optional but Recommended)**
   - Go to [platform.openai.com/account/billing/limits](https://platform.openai.com/account/billing/limits)
   - Set monthly spending limits to prevent unexpected charges
   - Monitor usage regularly

### Step 3: Check API Usage and Pricing

- **Pricing**: Check current pricing at [platform.openai.com/pricing](https://platform.openai.com/pricing)
- **Usage**: Monitor your usage at [platform.openai.com/usage](https://platform.openai.com/usage)
- **Models Available**: The project uses `gpt-4o-mini` which is cost-effective

## Part 2: Adding OpenAI Key to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Your Vercel Project**
   - Navigate to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project (e.g., `mlbb-party-winrate`)

2. **Navigate to Environment Variables**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add New Environment Variable**
   - Click **Add New** button
   - **Key**: `OPENAI_API_KEY` (exactly this name)
   - **Value**: Paste your OpenAI API key (the `sk-proj-...` key you copied)
   - **Environment**: Select all three:
     - ☑ Production
     - ☑ Preview
     - ☑ Development
   - Click **Save**

4. **Redeploy Your Application**
   - Go to **Deployments** tab
   - Click **"..."** menu on the latest deployment
   - Click **"Redeploy"**
   - Or make a new commit and push to trigger a new deployment

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variable
vercel env add OPENAI_API_KEY

# When prompted:
# - Value: Paste your API key
# - Environment: Select Production, Preview, Development (all)
# - Add another? No
```

## Part 3: Local Development Setup

For local development, add the key to `.env.local`:

1. **Create or Edit `.env.local`**
   ```bash
   # In your project root
   touch .env.local
   ```

2. **Add the API Key**
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Verify It Works**
   ```bash
   # Test locally
   npm run dev
   # Try calling the OpenAI API endpoint
   ```

**Important**: 
- Never commit `.env.local` to git (it's in `.gitignore`)
- Never commit API keys to your repository
- Keep your API keys secure

## Part 4: Verifying Setup

### Check if Key is Working

1. **Test via API Route**
   - Deploy your application
   - Call the `/api/openai/predict-explain` endpoint
   - If you get an error about missing API key, it's not configured correctly

2. **Check Vercel Build Logs**
   - Go to your deployment in Vercel
   - Check the build logs for any errors related to `OPENAI_API_KEY`

3. **Test Locally**
   ```bash
   # Start dev server
   npm run dev
   
   # In another terminal, test the endpoint
   curl -X POST http://localhost:3000/api/openai/predict-explain \
     -H "Content-Type: application/json" \
     -d '{"friendId": "test-id"}'
   ```

## Troubleshooting

### Problem: "OPENAI_API_KEY is not defined"

**Solutions:**
1. Verify the environment variable name is exactly `OPENAI_API_KEY` (case-sensitive)
2. Make sure you added it to all environments (Production, Preview, Development)
3. Redeploy your application after adding the variable
4. Check that `.env.local` exists locally with the key

### Problem: "Incorrect API key provided"

**Solutions:**
1. Verify you copied the full API key correctly
2. Check for extra spaces or newlines in the key
3. Create a new API key if the current one is invalid
4. Ensure you're using the key from the correct OpenAI account

### Problem: "You exceeded your current quota"

**Solutions:**
1. Add billing information at [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
2. Set up a payment method
3. Check usage limits at [platform.openai.com/account/billing/limits](https://platform.openai.com/account/billing/limits)
4. Upgrade your plan if needed

### Problem: "Rate limit exceeded"

**Solutions:**
1. Wait a few minutes and try again
2. Implement retry logic in your code
3. Consider using a different model (like `gpt-4o-mini` which has higher limits)
4. Check rate limits at [platform.openai.com/account/rate-limits](https://platform.openai.com/account/rate-limits)

## Security Best Practices

1. **Never Commit Keys**
   - ✅ Add `.env.local` to `.gitignore` (already done)
   - ✅ Never commit API keys to git
   - ✅ Use environment variables only

2. **Rotate Keys Regularly**
   - Create new keys periodically
   - Delete old unused keys
   - Revoke keys if compromised

3. **Use Different Keys for Different Environments**
   - Consider separate keys for Production, Preview, and Development
   - Easier to track usage and rotate individually

4. **Monitor Usage**
   - Check OpenAI dashboard regularly
   - Set up billing alerts
   - Review API usage logs

5. **Limit Key Permissions**
   - Use the most restrictive permissions possible
   - Don't share keys between projects

## Cost Management

### Model Used
- **Model**: `gpt-4o-mini` (configured in `lib/openai.ts`)
- **Cost**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Cheaper alternative**: Very cost-effective for structured outputs

### Estimate Costs
For this project:
- Each prediction call uses ~500-1000 tokens
- Cost per prediction: ~$0.001 - $0.0015
- 1000 predictions ≈ $1 - $1.5

### Set Usage Limits
1. Go to [platform.openai.com/account/billing/limits](https://platform.openai.com/account/billing/limits)
2. Set **Hard limit** (hard stop when reached)
3. Set **Soft limit** (notification when reached)
4. Enable email notifications

## Quick Checklist

- [ ] Created OpenAI account
- [ ] Added billing information
- [ ] Created API key
- [ ] Copied API key securely
- [ ] Added `OPENAI_API_KEY` to Vercel environment variables
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed application
- [ ] Added `OPENAI_API_KEY` to local `.env.local`
- [ ] Tested API call locally
- [ ] Verified deployment works
- [ ] Set usage limits on OpenAI dashboard
- [ ] Monitored first few API calls

## Resources

- **OpenAI Dashboard**: [platform.openai.com](https://platform.openai.com)
- **API Keys**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Usage**: [platform.openai.com/usage](https://platform.openai.com/usage)
- **Billing**: [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
- **Documentation**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Vercel Environment Variables**: [vercel.com/docs/projects/environment-variables](https://vercel.com/docs/projects/environment-variables)
