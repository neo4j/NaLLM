import json
import re

regex = "Nodes:\s+(.*?)\s?\s?Relationships:\s+(.*)"
internalRegex = "\[(.*?)\]"
jsonRegex = "\{.*\}"


def nodesTextToListOfDict(nodes):
    result = []
    for node in nodes:
        nodeList = node.split(",")
        if len(nodeList) < 2:
            continue

        name = nodeList[0].strip().replace('"', "")
        label = nodeList[1].strip().replace('"', "")
        properties = re.search(jsonRegex, node)
        if properties == None:
            properties = "{}"
        else:
            properties = properties.group(0)
        properties = properties.replace("True", "true")
        try:
            properties = json.loads(properties)
        except:
            properties = {}
        result.append({"name": name, "label": label, "properties": properties})
    return result


def relationshipTextToListOfDict(relationships):
    result = []
    for relation in relationships:
        relationList = relation.split(",")
        if len(relation) < 3:
            continue
        start = relationList[0].strip().replace('"', "")
        end = relationList[2].strip().replace('"', "")
        type = relationList[1].strip().replace('"', "")

        properties = re.search(jsonRegex, relation)
        if properties == None:
            properties = "{}"
        else:
            properties = properties.group(0)
        properties = properties.replace("True", "true")
        try:
            properties = json.loads(properties)
        except:
            properties = {}
        result.append(
            {"start": start, "end": end, "type": type, "properties": properties}
        )
    return result
