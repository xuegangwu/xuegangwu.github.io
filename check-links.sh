#!/bin/bash
# Link Checker Script for Personal Site
# Checks all links on the homepage

echo "🔍 Starting link check..."
echo "=========================="
echo ""

# Define colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    
    # Skip localhost and mailto links
    if [[ $url == *"localhost"* ]] || [[ $url == *"mailto:"* ]]; then
        echo -e "${YELLOW}⚠️  SKIP${NC}  $name"
        echo "      URL: $url"
        return
    fi
    
    # Check if URL is accessible
    if curl --output /dev/null --silent --head --max-time 10 "$url"; then
        echo -e "${GREEN}✅ OK${NC}    $name"
        echo "      URL: $url"
    else
        echo -e "${RED}❌ FAIL${NC}  $name"
        echo "      URL: $url"
    fi
}

echo "📍 Checking Personal Site Links..."
echo "-----------------------------------"

# Personal Site Internal Links
check_url "https://xuegangwu.github.io/" "Homepage"
check_url "https://xuegangwu.github.io/#projects" "Projects Section"
check_url "https://xuegangwu.github.io/#work" "Work Experience Section"
check_url "https://xuegangwu.github.io/#skills" "Skills Section"
check_url "https://xuegangwu.github.io/#education" "Education Section"
check_url "https://xuegangwu.github.io/#sitemap" "Site Map Section"

echo ""
echo "🦞 Checking Guangchu Project Links..."
echo "--------------------------------------"

# Guangchu Project Links
check_url "https://xuegangwu.github.io/guangchu/" "Guangchu Project Home"
check_url "https://xuegangwu.github.io/guangchu/project-intro.html" "Project Introduction"
check_url "https://xuegangwu.github.io/guangchu/web/diary-hub.html" "Diary Hub"
check_url "https://xuegangwu.github.io/guangchu/diary/index.html" "Diary List Index"
check_url "https://xuegangwu.github.io/guangchu/web/architecture.html" "System Architecture"
check_url "https://xuegangwu.github.io/guangchu/web/token-report.html" "Token Report"

echo ""
echo "🔗 Checking External Links..."
echo "------------------------------"

# External Links
check_url "https://github.com/xuegangwu" "GitHub Profile"
check_url "https://github.com/xuegangwu/guangchu" "Guangchu Repository"
check_url "https://www.linkedin.com/in/terry-wu-ba818216/" "LinkedIn Profile"

echo ""
echo "📧 Checking Email Links..."
echo "---------------------------"
echo "ℹ️  Email: wuxuegang@gmail.com (skipped - mailto link)"

echo ""
echo "=========================="
echo "✅ Link check complete!"
