import re
with open("src/app/components/AdminDashboard.tsx", "r") as f:
    code = f.read()

pattern_enquiries_inner = r'\{activeTab === "enquiries" && \([\s\S]*?\}\)\}'
match_inner = re.search(pattern_enquiries_inner, code)
print(match_inner is not None)
