import asyncio
from app.services.llm import get_llm_service
from app.models.schemas import CompanyProfile

async def test():
    llm = get_llm_service()
    print("\n--- Testing NVIDIA NIM (Mistral Large 3) ---\n")
    try:
        # Check if the nvidia provider exists and is first in the list
        print(f"NVIDIA configured: {llm.nvidia is not None}")
        
        system_prompt = "You are a data extraction bot."
        user_prompt = "Extract details for Acme Corp. Domain is acme.com, industry is SaaS."
        
        print("Sending test payload...")
        result = await llm.analyze(system_prompt, user_prompt, CompanyProfile)
        
        print(f"\nResult received successfully!")
        print(f"Company Name: {result.name}")
        print(f"Domain: {result.domain}")
        print(f"Industry: {result.industry}")
    except Exception as e:
        print(f"\nError occurred: {e}")

if __name__ == "__main__":
    asyncio.run(test())
