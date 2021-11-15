import { Button } from "@chakra-ui/button";
import { Text, Spinner, Link, Divider } from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/hooks";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/modal";
import { Flex } from "@chakra-ui/layout";
import { IconButton } from "@chakra-ui/button";
import { MdDeleteOutline } from "react-icons/md";
import { useEffect, useState } from "react";
import { Input } from "@chakra-ui/input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/table";

import NoMessage from "../global/NoMessage";

import useToast from "../../hooks/useToast";
import config from "../../config";

// active learning concert and passive learning concert
const Alc = () => {
  const [
    { audio, video, background_music, passive_background_sound, passive_audio, passive_images },
    setFiles,
  ] = useState({
    audio: "",
    video: "",
    background_music: "",
    passive_audio: "",
    passive_images: [],
    passive_background_sound: "",
  });
  const [timeout, setTimeout] = useState();

  const [processing, setProcessing] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  function handleInputChange(event) {
    const { name, files } = event.target;
    setFiles((pre) => ({ ...pre, [name]: name === "passive_images" ? files : files[0] }));
  }

  async function uploadItem() {
    setProcessing(true);
    const formData = new FormData();

    formData.append("audio", audio);
    formData.append("video", video);
    formData.append("background_music", background_music);
    for (let i = 0; i < passive_images.length; i++) {
      const passiveImage = passive_images[i];
      formData.append("passive_images", passiveImage);
    }
    formData.append("timeout", timeout);
    formData.append("passive_audio", passive_audio);
    formData.append("passive_background_sound", passive_background_sound);

    try {
      const res = await fetch(`${config.serverURL}/active_learning_concert`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const body = await res.json();

      if (res.ok) {
        toast({ status: "success", description: body.msg });
        setItems(body.items);
        setProcessing(false);
        onClose();
      } else {
        toast({ status: "error", description: body.msg });
        setProcessing(false);
      }
    } catch (err) {
      toast({ status: "error", description: err.message || "Error!" });
      setProcessing(false);
    }
  }

  async function fetchItems(abortController) {
    try {
      const res = await fetch(`${config.serverURL}/active_learning_concert`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: abortController.signal,
      });
      const body = await res.json();

      if (res.ok) {
        setItems(body.items);
        setLoading(false);
      } else {
        toast({ status: "error", description: body.msg });
      }
    } catch (err) {
      toast({ status: "error", description: err.message });
    }
  }

  async function deleteItem(itemId) {
    const confirmed = window.confirm(
      "Are you sure? You want to delete this item? It will be deleted permanently!"
    );

    if (confirmed) {
      try {
        const res = await fetch(`${config.serverURL}/active_learning_concert/${itemId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const body = await res.json();

        if (res.ok) {
          setItems(body.items);
          toast({ status: "success", description: body.msg });
        } else {
          toast({ status: "error", description: body.msg });
        }
      } catch (err) {
        toast({ status: "error", description: err.message });
      }
    }
  }

  useEffect(() => {
    const abortController = new AbortController();
    fetchItems(abortController);
    return () => abortController.abort();
  }, []);

  if (loading) {
    return (
      <Flex w="full" h="full" justify="center" align="center">
        <Spinner />
      </Flex>
    );
  }

  return (
    <div>
      <Button mb={10} colorScheme="secondary" onClick={onOpen} color="black">
        Add New Item
      </Button>

      {/* the modal to add a set of files */}
      <Modal onClose={onClose} isOpen={isOpen} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add new item</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex
              border="1px solid"
              p={3}
              borderRadius={5}
              borderColor="gray.100"
              direction="column"
              mb={5}
            >
              <Text mb={2}>Audio</Text>
              <input name="audio" onChange={handleInputChange} accept="audio/mpeg" type="file" />
            </Flex>
            <Flex
              border="1px solid"
              p={3}
              borderRadius={5}
              borderColor="gray.100"
              direction="column"
              mb={5}
            >
              <Text mb={2}>Background Sound</Text>
              <input
                name="background_music"
                onChange={handleInputChange}
                accept="audio/mpeg"
                type="file"
              />
            </Flex>
            <Flex
              border="1px solid"
              p={3}
              borderRadius={5}
              borderColor="gray.100"
              direction="column"
            >
              <Text mb={2}>Video</Text>
              <input name="video" onChange={handleInputChange} accept="video/mp4" type="file" />
            </Flex>

            <Divider my={10} />

            <Flex
              border="1px solid"
              p={3}
              borderRadius={5}
              borderColor="gray.100"
              direction="column"
              mb={5}
            >
              <Text mb={2}>Passive Learning Images</Text>
              <input
                multiple
                name="passive_images"
                onChange={handleInputChange}
                accept="image/*"
                type="file"
              />
            </Flex>
            <Flex mb={5}>
              <Input
                value={timeout}
                onChange={(event) => setTimeout(event.target.value)}
                placeholder="TimeSpan for each images (seconds)"
              />
            </Flex>
            <Flex
              border="1px solid"
              p={3}
              borderRadius={5}
              borderColor="gray.100"
              direction="column"
              mb={5}
            >
              <Text mb={2}>Passive Learning Audio</Text>
              <input
                name="passive_audio"
                onChange={handleInputChange}
                accept="audio/mpeg"
                type="file"
              />
            </Flex>
            <Flex
              border="1px solid"
              p={3}
              borderRadius={5}
              borderColor="gray.100"
              direction="column"
            >
              <Text mb={2}>Passive Learning Background-sound</Text>
              <input
                name="passive_background_sound"
                onChange={handleInputChange}
                accept="audio/mpeg"
                type="file"
              />
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} colorScheme="blue" mr={3}>
              Close
            </Button>
            <Button
              disabled={
                !audio ||
                !video ||
                !background_music ||
                processing ||
                !passive_images.length ||
                !passive_audio ||
                !timeout ||
                !passive_background_sound
              }
              onClick={uploadItem}
              colorScheme="secondary"
              color="black"
            >
              {processing ? "Processing..." : "Save"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {items && items.length > 0 ? (
        <Table minW="1500px" size="sm">
          <Thead>
            <Th>Audio</Th>
            <Th>bg Sound</Th>
            <Th>Video</Th>
            <Th>PS Audio</Th>
            <Th>PS Images</Th>
            <Th>PS bg sound</Th>
            <Th>Timeout</Th>
            <Th>Total views</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {items.map((item) => {
              return (
                <Tr key={item._id}>
                  <Td>
                    <Link as="a" href={item.audio.url} target="_blank">
                      {item.audio.name}
                    </Link>
                  </Td>
                  <Td>
                    <Link as="a" href={item.background_music.url} target="_blank">
                      {item.background_music.name}
                    </Link>
                  </Td>
                  <Td>
                    <Link as="a" href={item.video.url} target="_blank">
                      {item.video.name}
                    </Link>
                  </Td>
                  <Td>
                    <Link as="a" href={item.passive_audio.url} target="_blank">
                      {item.passive_audio.name}
                    </Link>
                  </Td>
                  <Td>{item.passive_images.length} Files</Td>
                  <Td>
                    <Link as="a" href={item.passive_background_sound.url} target="_blank">
                      {item.passive_background_sound.name}
                    </Link>
                  </Td>
                  <Td>{item.timeout} seconds</Td>
                  <Td>{item.viewers.length}</Td>
                  <Td>
                    <IconButton
                      onClick={() => deleteItem(item._id)}
                      icon={<MdDeleteOutline />}
                      colorScheme="red"
                    />
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      ) : (
        <NoMessage message="No Items Found" />
      )}
    </div>
  );
};

export default Alc;