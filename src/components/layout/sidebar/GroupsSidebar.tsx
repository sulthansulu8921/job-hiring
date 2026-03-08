import { usePosts } from "../../../context/PostsContext";
import { Button } from "../../ui/Button";
import { Users, ChevronRight } from "lucide-react";
import type { Group } from "../../../types";
import { useNavigate } from "react-router-dom";

export function GroupsSidebar() {
    const { groups, joinGroup, leaveGroup } = usePosts();
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary-600" />
                    Communities
                </h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto overflow-x-hidden scrollbar-hide">
                {groups.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                        No communities found.
                    </div>
                ) : (
                    groups.map((group: Group) => (
                        <div
                            key={group.id}
                            className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/groups/${group.id}`)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {group.image ? (
                                        <img src={group.image} alt={group.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-primary-700 font-bold text-xs">{group.name[0]}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-gray-900 truncate">{group.name}</h4>
                                    <p className="text-[10px] text-gray-400 truncate">{group.members_count || 0} members</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={group.is_member ? "outline" : "default"}
                                    className="h-7 text-[10px] px-2 min-w-[50px]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        group.is_member ? leaveGroup(group.id) : joinGroup(group.id);
                                    }}
                                >
                                    {group.is_member ? "Joined" : "Join"}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-2 border-t border-gray-100">
                <Button variant="ghost" className="w-full text-primary-600 hover:text-primary-700 hover:bg-primary-50 text-[10px] font-bold justify-between h-8 px-2">
                    Explore all
                    <ChevronRight className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
