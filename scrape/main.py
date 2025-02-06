import asyncio
import aiohttp

import argparse

async def handle_reddit():
    
    
    return
    
async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reddit")
    args = parser.parse_args()
    
    if (args.reddit):
        handle_reddit()
    
    return

if __name__ == "__main__":
    asyncio.run(main=main())
    