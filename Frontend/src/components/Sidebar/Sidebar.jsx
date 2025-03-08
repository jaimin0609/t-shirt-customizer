const Sidebar = () => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Special Offers</h2>
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded">
                        <p className="text-primary font-semibold">20% Off First Order</p>
                        <p className="text-sm text-gray-600">Use code: FIRST20</p>
                    </div>
                    {/* More promotions... */}
                </div>
            </div>
        </div>
    );
};

export default Sidebar; 