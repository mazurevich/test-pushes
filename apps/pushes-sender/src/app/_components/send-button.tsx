'use client';

import { useState } from "react";
import { api } from "~/trpc/react";

export const SendButton = () => {
  const [notificationTitle, setNotificationTitle] = useState("Test Notification");
  const [notificationBody, setNotificationBody] = useState("This is a test push notification!");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<"android" | "ios" | "web">("android");
  const [isDryRun, setIsDryRun] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const { data: usersTokens, refetch: refetchTokens } = api.pushNotifications.getUsersTokens.useQuery();
  const { data: topics } = api.pushNotifications.getTopics.useQuery();
  const { data: stats } = api.pushNotifications.getNotificationStats.useQuery({ startDate: new Date(), endDate: new Date() }, { enabled: false });

  // Mutations
  const sendToUserMutation = api.pushNotifications.sendToUser.useMutation();
  const sendToAllDevicesMutation = api.pushNotifications.sendToAllDevices.useMutation();
  const sendToPlatformMutation = api.pushNotifications.sendToPlatform.useMutation();
  const sendToTopicMutation = api.pushNotifications.sendToTopic.useMutation();

  const handleSendToUser = async () => {
    if (!selectedUserId) {
      alert("Please select a user");
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendToUserMutation.mutateAsync({
        userId: selectedUserId,
        payload: {
          title: notificationTitle,
          body: notificationBody,
          data: {
            type: "test",
            timestamp: new Date().toISOString(),
          },
        },
        dryRun: isDryRun,
      });

      alert(`Notification sent! Success: ${result.totalSent}, Failed: ${result.totalFailed}`);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToAllDevices = async () => {
    setIsLoading(true);
    try {
      const result = await sendToAllDevicesMutation.mutateAsync({
        payload: {
          title: notificationTitle,
          body: notificationBody,
          data: {
            type: "test",
            timestamp: new Date().toISOString(),
          },
        },
        dryRun: isDryRun,
      });

      alert(`Notification sent to all devices! Success: ${result.totalSent}, Failed: ${result.totalFailed}`);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToPlatform = async () => {
    setIsLoading(true);
    try {
      const result = await sendToPlatformMutation.mutateAsync({
        platform: selectedPlatform,
        payload: {
          title: notificationTitle,
          body: notificationBody,
          data: {
            type: "test",
            timestamp: new Date().toISOString(),
          },
        },
        dryRun: isDryRun,
      });

      alert(`Notification sent to ${selectedPlatform} devices! Success: ${result.totalSent}, Failed: ${result.totalFailed}`);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToTopic = async (topicName: string) => {
    setIsLoading(true);
    try {
      const result = await sendToTopicMutation.mutateAsync({
        topicName,
        payload: {
          title: notificationTitle,
          body: notificationBody,
          data: {
            type: "test",
            timestamp: new Date().toISOString(),
          },
        },
        dryRun: isDryRun,
      });

      alert(`Notification sent to topic "${topicName}"! ${result.success ? "Success" : "Failed"}`);
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Push Notification Sender</h1>
      
      {/* Notification Stats */}
      {stats && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Notification Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>Total: {stats.stats.total}</div>
            <div>Sent: {stats.stats.sent}</div>
            <div>Delivered: {stats.stats.delivered}</div>
            <div>Failed: {stats.stats.failed}</div>
            <div>Pending: {stats.stats.pending}</div>
          </div>
        </div>
      )}

      {/* Notification Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Notification Content</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <textarea
              value={notificationBody}
              onChange={(e) => setNotificationBody(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md h-20"
              placeholder="Notification body"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dryRun"
              checked={isDryRun}
              onChange={(e) => setIsDryRun(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="dryRun" className="text-sm">
              Dry Run (test mode - won't send actual notifications)
            </label>
          </div>
        </div>
      </div>

      {/* Send Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Send to User */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Send to User</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a user...</option>
                {usersTokens?.map((token) => (
                  <option key={token.id} value={token.userId || ""}>
                    {token.userId ? `User ${token.userId}` : "Anonymous"} - {token.platform}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSendToUser}
              disabled={isLoading || !selectedUserId}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send to User"}
            </button>
          </div>
        </div>

        {/* Send to Platform */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Send to Platform</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as "android" | "ios" | "web")}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="android">Android</option>
                <option value="ios">iOS</option>
                <option value="web">Web</option>
              </select>
            </div>
            <button
              onClick={handleSendToPlatform}
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send to Platform"}
            </button>
          </div>
        </div>
      </div>

      {/* Send to All Devices */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Send to All Devices</h3>
        <button
          onClick={handleSendToAllDevices}
          disabled={isLoading}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send to All Devices"}
        </button>
      </div>

      {/* Send to Topics */}
      {topics && topics.topics.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Send to Topics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {topics.topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleSendToTopic(topic.name)}
                disabled={isLoading}
                className="bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 disabled:opacity-50 text-sm"
              >
                {topic.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Tokens */}
      <div className="text-center">
        <button
          onClick={() => refetchTokens()}
          className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
        >
          Refresh Device Tokens
        </button>
      </div>
    </div>
  );
};